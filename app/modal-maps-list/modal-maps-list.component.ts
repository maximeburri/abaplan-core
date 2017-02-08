import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MapService } from "../core/map.service";
import { OptionMap } from "../core/map";
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'aba-modal-maps-footer',
  template: '<button type="button" class="btn btn-secondary" (click)="close()">Fermer</button>'
})
export class ModalMapFooterComponent {
  constructor(private parent: ModalComponent) {
  }
  private close(): void {
    this.parent.close();
  }
}

@Component({
  selector: 'aba-modal-maps',
  templateUrl: 'modal-maps-list.component.html',
  styleUrls: ['modal-maps-list.component.css']
})
export class ModalMapComponent {

  @Output() onSelectChoice: EventEmitter<number> = new EventEmitter();

  private maps: OptionMap[] = [];
  private filteredMaps: OptionMap[] = this.maps;
  private queryInputValue: string = "";

  constructor(private mapService: MapService, private parent: ModalComponent) {
    mapService.maps().subscribe(
      (maps : OptionMap[]) => {
        this.maps = maps;
        this.filteredMaps = maps;
      },
      (error) => {
        console.log(error);
      }
    );

  }

  public open(): void {
    this.filteredMaps = this.maps;
    this.queryInputValue = "";
    this.parent.open();
  }

  private onChange(query: string): void {
    if (query !== ""){
      this.filteredMaps = this.maps.filter( m => m.title.toLowerCase().includes(query.toLowerCase()) || m.uid.toString().includes(query));
    }else{
      this.filteredMaps = this.maps;
    }
  }

  private onClick(id: number): void {
    this.close();
    this.onSelectChoice.emit(id);
  }

}
