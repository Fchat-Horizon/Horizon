'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const ts = require('typescript');
const Lint = require('tslint');
class Rule extends Lint.Rules.AbstractRule {
  apply(sourceFile) {
    return this.applyWithFunction(sourceFile, walk, undefined);
  }
}
exports.Rule = Rule;
function walk(ctx) {
  if (ctx.sourceFile.isDeclarationFile) return;
  return ts.forEachChild(ctx.sourceFile, cb);
  function cb(node) {
    if (node.kind !== ts.SyntaxKind.PropertyDeclaration) return ts.forEachChild(node, cb);
    if (!node.decorators) return;
    const property = node;
    for (const decorator of node.decorators) {
      const call = decorator.expression.kind == ts.SyntaxKind.CallExpression ? decorator.expression : undefined;
      const name = (call && call.expression.getText()) || decorator.expression.getText();
      if (name === 'Prop') {
        if (!node.modifiers || !node.modifiers.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword))
          ctx.addFailureAtNode(property.name, 'Vue property should be readonly');
        if (
          call &&
          call.arguments.length > 0 &&
          call.arguments[0].properties.map(x => x.name.getText()).some(x => x === 'default' || x === 'required')
        ) {
          if (property.questionToken !== undefined)
            ctx.addFailureAtNode(property.name, 'Vue property is required and should not be optional.');
        } else if (property.questionToken === undefined)
          ctx.addFailureAtNode(property.name, 'Vue property should be optional - it is not required and has no default value.');
      }
    }
  }
}
