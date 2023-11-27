// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// TODO: additional words?
// TODO: resolve all?
// const todoExpr = /TODO:? /;
const WORDS_TO_CHECK = ["TODO", "FIXME"];

// Matches "word: ", "word ", "word- ", "word - " (and "word : ")
function regExpFromWord(word: string): RegExp {
	return new RegExp(`${word} ?[:\-]? `);
}

function getWordRangeInLine(document: vscode.TextDocument, line: vscode.TextLine, expr: RegExp): vscode.Range | undefined {
	// const line = editor.document.lineAt(editor.selection.active);
	const idx = line.text.search(expr);
	if (idx === -1) { return; }
	return document.getWordRangeAtPosition(new vscode.Position(line.lineNumber, idx), expr);
}

function currentLine(){
	const editor = vscode.window.activeTextEditor;
	return editor?.document.lineAt(editor.selection.active);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "todo-resolver" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('todo-resolver.resolve-todo', () => {
			// The code you place here will be executed every time your command is executed
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const range = getWordRangeInLine(editor.document, currentLine()!, regExpFromWord("TODO"));
				if (range) { editor.edit((builder) => builder.delete(range!)); }
				else { vscode.window.showErrorMessage("No TODOs on current line"); }
			}
		})
	);

	// Add quick action (lightbulb suggestion) for TODOs
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider("*", new Todoizer(), {
			providedCodeActionKinds: Todoizer.providedCodeActionKinds
		}));

	// TODO: should you bother registering a kb shortcut or just leave it up to user config?
}

export class Todoizer implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		if (this.lineHasNoTodos(document, range)) { return; }

		const resolveTodoFix = this.createFix(document, range, "TODO");
		const resolveFixmeFix = this.createFix(document, range, "FIXME");

		return [
			resolveTodoFix,
			resolveFixmeFix
		];
	}

	// TODO: It works but not all the time, should it be async?
	// Is there a delay?

	private lineHasNoTodos(document: vscode.TextDocument, range: vscode.Range): boolean {
		const start = range.start;
		const line = document.lineAt(start.line);
		let wordsPresent = false;
		WORDS_TO_CHECK.forEach((word) => {
			if (line.text.search(regExpFromWord(word)) !== -1) {
				// word found
				wordsPresent = true;
			}
		});
		return !wordsPresent;
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, type: string): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Resolve ${type}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		// Get a range
		// const line = document.lineAt(range.start.line);
		// const realRange = getWordRangeInLine(document, line, regExpFromWord(type));
		// fix.edit.replace(document.uri, realRange!, "");

		fix.command = {
			title: "wenis",  // Apparently not visible ¯\_(ツ)_/¯
			command: "todo-resolver.resolve-todo"
		}; 

		return fix;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
