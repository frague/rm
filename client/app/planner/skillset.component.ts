import { Component, Input } from '@angular/core';

@Component({
  selector: 'skillset',
  templateUrl: './skillset.component.html'
})
export class SkillsetComponent {
  @Input() skills: any = null;
  @Input() class: string = '';
}