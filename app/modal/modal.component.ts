import {
  Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA,
  Injectable
} from "@angular/core";
import { MapService } from "../core/map.service";
import { OptionMap } from "../core/map";
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ModalService {

  private initSubject= new Subject<undefined>();

  public onOpenObservable = this.initSubject.asObservable();

  public init() {
    this.initSubject.next();
  }

}

@Component({
  selector: 'aba-modal',
  templateUrl: 'modal.component.html',
  styleUrls: ['modal.component.css'],
  providers: [ModalService]
})
export class ModalComponent {

  @Input('visible') visible: boolean = false;
  @Input('title') title: string;

  constructor(private modalService: ModalService) {

  }

  private isVisible(): boolean {
    return this.visible;
  }

  public open(): void {
    this.modalService.init();
    this.visible = true;
  }

  public close(): void {
    this.visible = false;
  }

  private onClick(id: number): void {
    this.close();
  }

}
