import React from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import { WebDSService } from "@webds/service";

import GearSelectionComponent from "./GearSelectionComponent";

export class GearSelectionWidget extends ReactWidget {
  id: string;
  service: WebDSService;

  constructor(id: string, service: WebDSService) {
    super();
    this.id = id;
    this.service = service;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + "_component"}>
        <GearSelectionComponent service={this.service} />
      </div>
    );
  }
}

export default GearSelectionWidget;
