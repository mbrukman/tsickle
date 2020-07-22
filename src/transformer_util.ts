/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/** @return true if node has the specified modifier flag set. */
export function hasModifierFlag(declaration: ts.Declaration, flag: ts.ModifierFlags): boolean {
  return (ts.getCombinedModifierFlags(declaration) & flag) !== 0;
}

/** @return true if node has the specified modifier flag set. */
export function isAmbient(node: ts.Node): boolean {
  let current: ts.Node|undefined = node;
  while (current) {
    if (hasModifierFlag(current as ts.Declaration, ts.ModifierFlags.Ambient)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/** Returns true if fileName is a .d.ts file. */
export function isDtsFileName(fileName: string): boolean {
  return fileName.endsWith('.d.ts');
}

/** Returns the string contents of a ts.Identifier. */
export function getIdentifierText(identifier: ts.Identifier): string {
  // NOTE: 'escapedText' on an Identifier may be escaped if it starts with '__'. The alternative,
  // getText(), cannot be used on synthesized nodes, so unescape the identifier below.
  return unescapeName(identifier.escapedText);
}

/**
 * Returns true if the given symbol refers to a value (as distinct from a type).
 *
 * Expands aliases, which is important for the case where
 *   import * as x from 'some-module';
 * and x is now a value (the module object).
 */
export function symbolIsValue(tc: ts.TypeChecker, sym: ts.Symbol): boolean {
  if (sym.flags & ts.SymbolFlags.Alias) sym = tc.getAliasedSymbol(sym);
  return (sym.flags & ts.SymbolFlags.Value) !== 0;
}

/** Returns a dot-joined qualified name (foo.bar.Baz). */
export function getEntityNameText(name: ts.EntityName): string {
  if (ts.isIdentifier(name)) {
    return getIdentifierText(name);
  }
  return getEntityNameText(name.left) + '.' + getIdentifierText(name.right);
}

/**
 * Converts an escaped TypeScript name into the original source name.
 */
export function unescapeName(name: ts.__String): string {
  // See the private function unescapeIdentifier in TypeScript's utilities.ts.
  const str = name as string;
  if (str.startsWith('___')) return str.substring(1);
  return str;
}

/**
 * ts.createNotEmittedStatement will create a node, but the comments covered by its text range are
 * never emittedm except for very specific special cases (/// comments).
 *
 * createNotEmittedStatementWithComments creates a not emitted statement and adds comment ranges
 * from the original statement as synthetic comments to it, so that they get retained in the output.
 */
export function createNotEmittedStatementWithComments(
    sourceFile: ts.SourceFile, original: ts.Node): ts.Statement {
  let replacement = ts.createNotEmittedStatement(original);
  // NB: synthetic nodes can have pos/end == -1. This is handled by the underlying implementation.
  const leading = ts.getLeadingCommentRanges(sourceFile.text, original.pos) || [];
  const trailing = ts.getTrailingCommentRanges(sourceFile.text, original.end) || [];
  replacement =
      ts.setSyntheticLeadingComments(replacement, synthesizeCommentRanges(sourceFile, leading));
  replacement =
      ts.setSyntheticTrailingComments(replacement, synthesizeCommentRanges(sourceFile, trailing));
  return replacement;
}

/**
 * Converts `ts.CommentRange`s into `ts.SynthesizedComment`s.
 */
export function synthesizeCommentRanges(
    sourceFile: ts.SourceFile, parsedComments: ts.CommentRange[]): ts.SynthesizedComment[] {
  const synthesizedComments: ts.SynthesizedComment[] = [];
  parsedComments.forEach(({kind, pos, end, hasTrailingNewLine}, commentIdx) => {
    let commentText = sourceFile.text.substring(pos, end).trim();
    if (kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      commentText = commentText.replace(/(^\/\*)|(\*\/$)/g, '');
    } else if (kind === ts.SyntaxKind.SingleLineCommentTrivia) {
      if (commentText.startsWith('///')) {
        // triple-slash comments are typescript specific, ignore them in the output.
        return;
      }
      commentText = commentText.replace(/(^\/\/)/g, '');
    }
    synthesizedComments.push({kind, text: commentText, hasTrailingNewLine, pos: -1, end: -1});
  });
  return synthesizedComments;
}

/**
 * Creates a non emitted statement that can be used to store synthesized comments.
 */
export function createNotEmittedStatement(sourceFile: ts.SourceFile): ts.NotEmittedStatement {
  const stmt = ts.createNotEmittedStatement(sourceFile);
  ts.setOriginalNode(stmt, undefined);
  ts.setTextRange(stmt, {pos: 0, end: 0});
  ts.setEmitFlags(stmt, ts.EmitFlags.CustomPrologue);
  return stmt;
}

/**
 * This is a version of `ts.visitEachChild` that works that calls our version
 * of `updateSourceFileNode`, so that typescript doesn't lose type information
 * for property decorators.
 * See https://github.com/Microsoft/TypeScript/issues/17384
 *
 * @param sf
 * @param statements
 */
export function visitEachChild(
    node: ts.Node, visitor: ts.Visitor, context: ts.TransformationContext): ts.Node {
  if (node.kind === ts.SyntaxKind.SourceFile) {
    const sf = node as ts.SourceFile;
    return updateSourceFileNode(sf, ts.visitLexicalEnvironment(sf.statements, visitor, context));
  }

  return ts.visitEachChild(node, visitor, context);
}

/**
 * This is a version of `ts.updateSourceFileNode` that works
 * well with property decorators.
 * See https://github.com/Microsoft/TypeScript/issues/17384
 * TODO(#634): This has been fixed in TS 2.5. Investigate removal.
 *
 * @param sf
 * @param statements
 */
export function updateSourceFileNode(
    sf: ts.SourceFile, statements: ts.NodeArray<ts.Statement>): ts.SourceFile {
  if (statements === sf.statements) {
    return sf;
  }
  sf = ts.factory.updateSourceFile(
      sf,
      statements,
      sf.isDeclarationFile,
      sf.referencedFiles,
      sf.typeReferenceDirectives,
      sf.hasNoDefaultLib,
      sf.libReferenceDirectives,
  );
  return sf;
}

// Copied from TypeScript
export function isTypeNodeKind(kind: ts.SyntaxKind) {
  return (kind >= ts.SyntaxKind.FirstTypeNode && kind <= ts.SyntaxKind.LastTypeNode) ||
      kind === ts.SyntaxKind.AnyKeyword || kind === ts.SyntaxKind.NumberKeyword ||
      kind === ts.SyntaxKind.ObjectKeyword || kind === ts.SyntaxKind.BooleanKeyword ||
      kind === ts.SyntaxKind.StringKeyword || kind === ts.SyntaxKind.SymbolKeyword ||
      kind === ts.SyntaxKind.ThisKeyword || kind === ts.SyntaxKind.VoidKeyword ||
      kind === ts.SyntaxKind.UndefinedKeyword || kind === ts.SyntaxKind.NullKeyword ||
      kind === ts.SyntaxKind.NeverKeyword || kind === ts.SyntaxKind.ExpressionWithTypeArguments;
}

/**
 * Creates a string literal that uses single quotes. Purely cosmetic, but increases fidelity to the
 * existing test suite.
 */
export function createSingleQuoteStringLiteral(text: string): ts.StringLiteral {
  const stringLiteral = ts.createLiteral(text);
  // tslint:disable-next-line:no-any accessing TS internal API.
  (stringLiteral as any)['singleQuote'] = true;
  return stringLiteral;
}

/** Creates a not emitted statement with the given text as a single line comment. */
export function createSingleLineComment(original: ts.Node, text: string) {
  const comment: ts.SynthesizedComment = {
    kind: ts.SyntaxKind.SingleLineCommentTrivia,
    text: ' ' + text,
    hasTrailingNewLine: true,
    pos: -1,
    end: -1,
  };
  return ts.setSyntheticTrailingComments(ts.createNotEmittedStatement(original), [comment]);
}

/** Creates a not emitted statement with the given text as a single line comment. */
export function createMultiLineComment(original: ts.Node, text: string) {
  const comment: ts.SynthesizedComment = {
    kind: ts.SyntaxKind.MultiLineCommentTrivia,
    text: ' ' + text,
    hasTrailingNewLine: true,
    pos: -1,
    end: -1,
  };
  return ts.setSyntheticTrailingComments(ts.createNotEmittedStatement(original), [comment]);
}

/**
 * debugWarn logs a debug warning.
 *
 * These should only be used for cases where tsickle is making a questionable judgement about what
 * to do. By default, tsickle does not report any warnings to the caller, and warnings are hidden
 * behind a debug flag, as warnings are only for tsickle to debug itself.
 */
export function reportDebugWarning(
    host: {logWarning ? (d: ts.Diagnostic) : void}, node: ts.Node, messageText: string) {
  if (!host.logWarning) return;
  host.logWarning(createDiagnostic(
      node, messageText, /* textRange */ undefined, ts.DiagnosticCategory.Warning));
}

/**
 * Creates and reports a diagnostic by adding it to the given array.
 *
 * This is used for errors and warnings in tsickle's input. Emit errors (the default) if tsickle
 * cannot emit a correct result given the input. Emit warnings for questionable input if there's a
 * good chance that the output will work.
 *
 * For typical tsickle users, errors are always reported and break the compilation operation,
 * warnings will only be emitted for first party code (and break the compilation there), but wil be
 * ignored for third party code.
 *
 * @param textRange pass to overrride the text range from the node with a more specific range.
 */
export function reportDiagnostic(
    diagnostics: ts.Diagnostic[], node: ts.Node, messageText: string, textRange?: ts.TextRange,
    category = ts.DiagnosticCategory.Error) {
  diagnostics.push(createDiagnostic(node, messageText, textRange, category));
}

function createDiagnostic(
    node: ts.Node, messageText: string, textRange: ts.TextRange|undefined,
    category: ts.DiagnosticCategory): ts.Diagnostic {
  let start, length: number;
  if (textRange) {
    start = textRange.pos;
    length = textRange.end - textRange.pos;
  } else {
    // Only use getStart if node has a valid pos, as it might be synthesized.
    start = node.pos >= 0 ? node.getStart() : 0;
    length = node.end - node.pos;
  }
  return {
    file: node.getSourceFile(),
    start,
    length,
    messageText,
    category,
    code: 0,
  };
}

/**
 * A replacement for ts.getLeadingCommentRanges that returns the union of synthetic and
 * non-synthetic comments on the given node, with their text included. The returned comments must
 * not be mutated, as their content might or might not be reflected back into the AST.
 */
export function getAllLeadingComments(node: ts.Node):
    ReadonlyArray<Readonly<ts.CommentRange&{text: string}>> {
  const allRanges: Array<Readonly<ts.CommentRange&{text: string}>> = [];
  const nodeText = node.getFullText();
  const cr = ts.getLeadingCommentRanges(nodeText, 0);
  if (cr) allRanges.push(...cr.map(c => ({...c, text: nodeText.substring(c.pos, c.end)})));
  const synthetic = ts.getSyntheticLeadingComments(node);
  if (synthetic) allRanges.push(...synthetic);
  return allRanges;
}
