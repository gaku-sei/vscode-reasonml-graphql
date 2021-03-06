import * as path from "path";
import {
  workspace,
  ExtensionContext,
  window,
  OutputChannel,
  commands,
  TextEditorEdit,
  Range,
  Position
} from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";

import { prettify, restoreOperationPadding } from "./extensionUtils";
import { extractGraphQLSources } from "./findGraphQLSources";

import { GraphQLSource } from "./extensionTypes";

import { addGraphQLComponent } from "./addGraphQLComponent";

function formatDocument() {
  const textEditor = window.activeTextEditor;

  if (!textEditor) {
    window.showErrorMessage("Missing active text editor.");
    return;
  }

  const sources = extractGraphQLSources(
    textEditor.document.languageId,
    textEditor.document.getText()
  );

  textEditor.edit((editBuilder: TextEditorEdit) => {
    const textDocument = textEditor.document;

    if (!textDocument) {
      return;
    }

    if (sources) {
      sources.forEach((source: GraphQLSource) => {
        if (source.type === "TAG" && /^[\s]+$/g.test(source.content)) {
          window.showInformationMessage("Cannot format an empty code block.");
          return;
        }
        try {
          const newContent = restoreOperationPadding(
            prettify(source.content),
            source.content
          );

          if (source.type === "TAG") {
            editBuilder.replace(
              new Range(
                new Position(source.start.line, source.start.character),
                new Position(source.end.line, source.end.character)
              ),
              newContent
            );
          } else if (source.type === "FULL_DOCUMENT" && textDocument) {
            editBuilder.replace(
              new Range(
                new Position(0, 0),
                new Position(textDocument.lineCount + 1, 0)
              ),
              newContent
            );
          }
        } catch {
          // Silent
        }
      });
    }
  });
}

function initCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(
      "vscode-reasonml-graphql.format-document",
      formatDocument
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-reason-relay-fragment",
      () => addGraphQLComponent("ReasonRelay", "Fragment")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-reason-relay-query",
      () => addGraphQLComponent("ReasonRelay", "Query")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-reason-relay-mutation",
      () => addGraphQLComponent("ReasonRelay", "Mutation")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-reason-relay-subscription",
      () => addGraphQLComponent("ReasonRelay", "Subscription")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-graphqlppx-fragment",
      () => addGraphQLComponent("graphql_ppx", "Fragment")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-graphqlppx-query",
      () => addGraphQLComponent("graphql_ppx", "Query")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-graphqlppx-mutation",
      () => addGraphQLComponent("graphql_ppx", "Mutation")
    ),
    commands.registerCommand(
      "vscode-reasonml-graphql.add-graphqlppx-subscription",
      () => addGraphQLComponent("graphql_ppx", "Subscription")
    )
  );
}

function initLanguageServer(
  context: ExtensionContext,
  outputChannel: OutputChannel
): void {
  const serverModule = context.asAbsolutePath(path.join("build", "server.js"));

  /*
  const debugOptions = {
    execArgv: ["--nolazy", "--debug=6009", "--inspect=localhost:6009"]
  };
  */

  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc
    }
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "graphql" },
      { scheme: "file", language: "reason" }
    ],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.{graphql,gql,re}")
    },
    outputChannel: outputChannel,
    outputChannelName: "GraphQL Language Server"
  };

  const client = new LanguageClient(
    "vscode-reasonml-graphql",
    "GraphQL Language Server",
    serverOptions,
    clientOptions
  );

  const disposableClient = client.start();
  context.subscriptions.push(disposableClient);
}

export async function activate(context: ExtensionContext) {
  let outputChannel: OutputChannel = window.createOutputChannel(
    "GraphQL Language Server"
  );

  initLanguageServer(context, outputChannel);
  initCommands(context);
}

export function deactivate() {
  console.log('Extension "vscode-reasonml-graphql" is now de-activated!');
}
