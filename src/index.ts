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

namespace Attributes {
  export const command = "webds_gear_selection:open";
  export const id = "webds_gear_selection_widget";
  export const label = "Gear Selection";
  export const caption = "Gear Selection";
  export const category = "Touch - Manual Config";
  export const rank = 20;
}

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
    const command = Attributes.command;
    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? gearSelectionIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new GearSelectionWidget(Attributes.id, service);
          widget = new WebDSWidget<GearSelectionWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.icon = gearSelectionIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, "main");

        shell.activateById(widget.id);

        widget.setShadows();
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: Attributes.id
    });
    restorer.restore(tracker, {
      command,
      name: () => Attributes.id
    });
  }
};

export default plugin;
