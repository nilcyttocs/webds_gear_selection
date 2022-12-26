import React from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import GearSelectionComponent from "./GearSelectionComponent";

export class GearSelectionWidget extends ReactWidget {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + "_component"}>
        <GearSelectionComponent />
      </div>
    );
  }
}

export default GearSelectionWidget;
