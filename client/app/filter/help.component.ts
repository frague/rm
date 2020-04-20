import { Component, Output, EventEmitter } from '@angular/core';

const sections = {
  logic: 'Common logic',
  functions: 'Functions',
  persons: 'Persons',
  assignments: 'Assignments',
  demands: 'Demands',
  requisitions: 'Requisitions',
  candidates: 'Candidates',
  comments: 'Comments',
  skills: 'Skills',
};

@Component({
  selector: 'help',
  templateUrl: './help.component.html'
})
export class HelpComponent {
  private _selectedSection = 'logic';
  @Output() populate: EventEmitter<string> = new EventEmitter();

  public getTitle(section: string): string {
    return sections[section];
  };

  public get sections(): string[] {
    return Object.keys(sections);
  }

  public select(section: string) {
    this._selectedSection = section;
  }

  public isSelected(section: string): boolean {
    return this._selectedSection === section;
  }

  public click(event: MouseEvent) {
    let srcElement = event.srcElement as Element;
    if (srcElement && srcElement.tagName === 'DFN') {
      this.populate.emit(srcElement['innerText']);
    }
  }
}