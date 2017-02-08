import {Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from "@angular/core";
import { MapService } from "../core/map.service";
import { OptionMap } from "../core/map";


@Component({
  selector: 'aba-modal',
  templateUrl: 'modal.component.html',
  styleUrls: ['modal.component.css']
})
export class ModalComponent {

  @Input('visible') visible: boolean = false;
  @Input('title') title: string;

  private isVisible(): boolean {
    return this.visible;
  }

  public open(): void {
    this.visible = true;
  }

  public close(): void {
    this.visible = false;
  }

  private onClick(id: number): void {
    this.close();
  }

}
