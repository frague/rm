import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { SkillsService} from '../../services/skills.service';

@Component({
  selector: 'skills-tab',
  templateUrl: './skills-tab.component.html'
})
export class SkillsTabComponent extends BaseTabComponent {
  @Input() login: string = '';
  @Input() state: any = {};
  skillsFetching: boolean;
  skills: any;
  skillsInfo: any;

  surveyStates = {
    'COMPLETE': 'Completed',
    'IN_PROGRESS': 'In progress'
  };

  constructor(
    private skillsService: SkillsService
  ) {
    super();
  }

  getCategoriesHalf(getFirst=true): string[] {
    let categories= (this.skills || {}).categories || [];
    let l = Math.ceil(categories.length / 2);
    if (!l) {
      return [];
    }
    return getFirst ? categories.slice(0, l) : categories.slice(l);
  }

  private _countSkillsDefined(skills: any) {
    let skillsDefined = 0;
    if (skills.categories && skills.categories.length) {
      skills.categories.forEach(category =>
        skillsDefined += this._countSkillsDefined(category)
      );
    };
    if (skills.skills && skills.skills.length) {
      skillsDefined += skills.skills.reduce((result, skill) => {
        if (skill.declared_level || skill.approved_level) result += 1;
        if (skill.techs) {
          let techs = skill.techs.filter(tech => tech.declared_level || tech.approved_level).length;
          if (techs && !skill.declared_level && !skill.approved_level) skill.declared_level = '-';
          skill.techsDefined = techs;
          result += techs;
        }
        return result;
      }, 0);
    }
    skills.skillsDefined = skillsDefined;
    return skillsDefined;
  }

  fetchData() {
    [this.skills, this.skillsInfo] = this.getState('skills', this.login) || [null, null];
    if (this.skills && this.skillsInfo) {
      return;
    }

    let loadersCount = 2;
    let loaded = () => {
      this.isLoading = !!--loadersCount
      if (!this.isLoading) {
        this.setState('skills', this.login, [this.skills, this.skillsInfo]);
      }
    };

    this.isLoading = true;

    this.skillsService.get(this.login)
      .subscribe(skills => {
        this._countSkillsDefined(skills);
        this.skills = skills;
      })
      .add(loaded);

    this.skillsService.getInfo(this.login)
      .subscribe(info => this.skillsInfo = info)
      .add(loaded);
  }
}