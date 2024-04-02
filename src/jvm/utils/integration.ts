import Thread from '../thread'
import { JvmObject } from '../types/reference/Object'
import { ResultType } from '../types/Result'
import { j2jsString, js2jString } from '.'

export async function loadCachedFiles(
  loader: () => Promise<{ [key: string]: string }>
): Promise<{ [classname: string]: string }> {
  return new Promise((resolve, reject) => {
    const indexedDB = window.indexedDB

    // open db
    const open = indexedDB.open('Source Academy', 1)

    // called when version changes/init
    open.onupgradeneeded = function () {
      const db = open.result
      const store = db.createObjectStore('JavaLibrary', { keyPath: 'name' })
      store.createIndex('FileNameIndex', ['name'])
    }

    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction('JavaLibrary', 'readwrite')

      // check if files loaded, load if missing.
      const req = tx.objectStore('JavaLibrary').count()
      req.onsuccess = () => {
        // load
        if (req.result === 0) {
          loader()
            .then(stdlib => {
              const classnames = Object.keys(stdlib)
              let index = 0
              const writetx = db.transaction('JavaLibrary', 'readwrite')
              const populate = () => {
                if (index >= classnames.length) {
                  db.close()
                  resolve(stdlib)
                  return
                }
                const classname = classnames[index]
                const content = stdlib[classname as keyof typeof stdlib]
                const putReq = writetx.objectStore('JavaLibrary').put({
                  name: classname,
                  content: content
                })
                putReq.onsuccess = populate
                putReq.onerror = event => {
                  db.close()
                  reject(event)
                }
                index++
              }
              populate()
            })
            .catch(e => {
              reject(e)
            })
        } else {
          const openCursorRequest = tx.objectStore('JavaLibrary').openCursor()

          openCursorRequest.onerror = event => reject(event)
          const stdlib: { [key: string]: string } = {}
          openCursorRequest.onsuccess = () => {
            const cursor = openCursorRequest.result
            if (cursor) {
              stdlib[cursor.value.name as string] = cursor.value.content
              cursor.continue()
            } else {
              // no more values
              resolve(stdlib)
              db.close()
            }
          }
        }
      }
      req.onerror = event => {
        reject(event)
      }
    }
  })
}

export function createModuleProxy(
  module: string,
  moduleFuncs: {
    [key: string]: Function | object
  }
) {
  const mappedFuncs: { [methodname: string]: any } = {}
  const javaClassname = `modules/${module}/${module.charAt(0).toUpperCase() + module.slice(1)}`

  // create module function bridge
  for (const [key, value] of Object.entries(moduleFuncs)) {
    if (typeof value !== 'function') {
      continue
    }

    mappedFuncs[key] = (thread: Thread, locals: any[]) => {
      const nativelocals = locals.map(local => {
        if (typeof local === 'object') {
          if ((local as JvmObject).getClass().getName() === 'java/lang/String') {
            return j2jsString(local)
          }
          return local.getNativeField('$value')
        } else {
          return local
        }
      })

      let returnValue

      if (thread.peekStackFrame().operandStack.length) {
        const popResult = thread.popStack()
        if (popResult.status === ResultType.SUCCESS) {
          returnValue = popResult.result
        } else {
          throw new Error('Stack underflow')
        }
      } else {
        returnValue = value(...nativelocals)
      }

      if (typeof returnValue === 'object') {
        let javaObject: JvmObject
        if (thread.peekStackFrame().operandStack.length) {
          const popResult = thread.popStack()
          if (popResult.status === ResultType.SUCCESS) {
            javaObject = popResult.result
          } else {
            // exception already thrown
            return
          }
        } else {
          const javaClass = thread
            .getClass()
            .getLoader()
            .getClass(`modules/${module}/${returnValue.constructor.name.slice(1)}`)
          if (javaClass.status === ResultType.ERROR) {
            thread.throwNewException(javaClass.exceptionCls, javaClass.msg)
            return
          }
          javaObject = javaClass.result.instantiate()
        }

        thread.pushStack(javaObject)
        thread.pushStack(returnValue)
        const initStatus = javaObject.initialize(thread)
        switch (initStatus.status) {
          case ResultType.DEFER:
            return
          case ResultType.ERROR:
            throw new Error('Error initializing Object')
        }
        try {
          javaObject.putNativeField('$value', returnValue)
          thread.returnStackFrame(javaObject)
        } catch (e) {
          throw e
        }
      } else if (typeof returnValue === 'string') {
        const javaString = js2jString(thread.getJVM().getBootstrapClassLoader(), returnValue)
        thread.returnStackFrame(javaString)
      } else if (returnValue === undefined) {
        thread.returnStackFrame()
      } else {
        // might need to determine wide values (long/double)
        thread.returnStackFrame(returnValue)
      }
    }
  }

  // linkField function for static init of constants as static fields
  mappedFuncs['linkField'] = (thread: Thread, locals: any[]) => {
    if (!locals[0] || !locals[1]) {
      throw new Error(`Null param`)
    }

    const javaObject: JvmObject = locals[0]
    const name = j2jsString(locals[1])
    javaObject.putNativeField('$value', moduleFuncs[name])
    thread.returnStackFrame()
  }

  const funcProxy = new Proxy(mappedFuncs, {
    get(_target, prop) {
      const jname = prop as string
      const jsname = jname.slice(0, jname.indexOf('('))
      return mappedFuncs[jsname]
    }
  })

  return { javaClassname, proxy: funcProxy }
}
