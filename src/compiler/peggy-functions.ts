export const peggyFunctions = `
{
  function buildBinaryExpression(head, tail) {
    return tail.reduce((result, element) => {
      return addLocInfo({
        kind: "BinaryExpression",
        operator: element[0],
        left: result,
        right: element[1]
      });
    }, head);
  }

  /**
   * Helper function to create and return a Node with location information
   */
  function addLocInfo(node) {
    const loc = location();
    return {
      ...node,
      location: loc,
    };
  }
}
`
