import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { WidgetTracker } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { WebDSService, WebDSWidget } from "@webds/service";

import { gearSelectionIcon } from "./icons";

import { GearSelectionWidget } from "./widget_container";

/**
 * Initialization data for the @webds/gear_selection extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/gear_selection:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: async (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log("JupyterLab extension @webds/gear_selection is activated!");

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command: string = "webds_gear_selection:open";
    commands.addCommand(command, {
      label: "Gear Selection",
      caption: "Gear Selection",
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? gearSelectionIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new GearSelectionWidget(app, service);
          widget = new WebDSWidget<GearSelectionWidget>({ content });
          widget.id = "webds_gear_selection_widget";
          widget.title.label = "Gear Selection";
          widget.title.icon = gearSelectionIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, "main");

        shell.activateById(widget.id);
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: "WebDS - Tuning"
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: "webds_gear_selection"
    });
    restorer.restore(tracker, {
      command,
      name: () => "webds_gear_selection"
    });
  }
};

export default plugin;
