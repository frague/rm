import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService} from '../services/comments.service';
import { SkillsService} from '../services/skills.service';
import { CarreerService} from '../services/carreer.service';
import { BaseComponent } from '../base.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PrintableDatePipe } from '../pipes';

const discardConfirmation = 'Are you sure you want to discard current changes?';
const empty = {
  date: null,
  isStatus: null,
  login: null,
  source: null,
  text: null,
  _id: null
};

const datePipe = new PrintableDatePipe();

@Component({
  selector: 'comments-modal',
  templateUrl: './comments.component.html'
})
export class CommentsComponent extends BaseComponent {
  @ViewChild('content') content;

  surveyStates = {
    'COMPLETE': 'Completed',
    'IN_PROGRESS': 'In progress'
  };

  skillsFetching = false;

  person: any = {};
  comments: any[] = [];
  status: any = '';
  aggregated: any[] = [];
  modalRef: any

  activeTab: string;
  skills: any = null;
  skillsInfo: any = null;

  carreer: any = {};

  initialValue: any = empty;
  closeAfterSaving = true;

  form = new FormGroup({
    _id: new FormControl(''),
    login: new FormControl(''),
    date: new FormControl(''),
    isStatus: new FormControl(),
    source: new FormControl(''),
    text: new FormControl('', Validators.required)
  })

  // Charting data
  // lineChart
  public lineChartData: Array<any> = [
    {data: [0], label: ''},
  ];
  public lineChartLabels: Array<any> = [''];
  public lineChartOptions:any = {
    responsive: true,
    elements: {
      point: {
        pointStyle: 'rectRot'
      }
    },
    scales: {
      yAxes: [{
        ticks: {
          stepSize: 10000
        }
      }]
    }
  };
  public lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
  ];
  public lineChartLegend: boolean = false;
  public lineChartType: string = 'line';

  constructor(
    private modalService: NgbModal,
    private commentService: CommentService,
    private skillsService: SkillsService,
    private carreerService: CarreerService
  ) {
    super(commentService);
  }

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();

    this.activeTab = e.nextId;
    this.form.reset();
    this.initialValue = empty;

    if (this.activeTab === 'skills' && this.skills === null) {
      this.fetchSkills();
    }

    if (this.activeTab === 'carreer') {
      this.fetchCarreer();
    }
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

  fetchSkills() {
    let loadersCount = 2;
    let loaded = () => this.skillsFetching = !!--loadersCount;

    this.skillsFetching = true;

    this.skillsService.get(this.person.login)
      .subscribe(skills => {
        this._countSkillsDefined(skills);
        this.skills = skills;
      })
      .add(loaded);

    this.skillsService.getInfo(this.person.login)
      .subscribe(info => this.skillsInfo = info)
      .add(loaded);
  }

  fetchCarreer() {
    if (!this.isCarreerFetched()) {
      this.isLoading = true;
      this.carreerService.get(this.person.bambooId)
        .subscribe(carreer => {
          this.carreer = carreer;
          let labels = [];
          let result = (carreer.compensations || [])
            .reverse()
            .map(compensation => {
              labels.push(datePipe.transform(compensation.startDate, 'nodate'));
              return Math.round(compensation.rate.value);
            }
          );

          // if (result.length == 1) {
          //   labels.push(datePipe.transform(new Date(), true));
          //   result.push(result[0]);
          // };

          this.lineChartLabels = labels;
          this.lineChartData = [{
            label: 'Compensation',
            pointRadius: 10,
            data: result
          }];
        })
        .add(() => this.isLoading = false);
    }
  }

  getEditedValue() {
    let comment = super.getEditedValue();
    comment.login = this.person.login;
    comment.date = new Date();
    return comment;
  }

  getLines(text: string): string[] {
    return (text || '').split('\n');
  }

  saveComplex(tabs) {
    let newValue = this.getEditedValue();
    let newStatus = newValue.isStatus ? newValue.text : '';
    let doChange = newValue.isStatus || this.item.isStatus;
    return super.save().add(() => {
      if (!newValue._id) {
        this.person.commentsCount++;
      }
      if (doChange) {
        this.person.status = newValue.isStatus ? newValue : {};
        this.form.reset();
        this.initialValue = empty;
      }
      if (this.closeAfterSaving) {
        this.modalRef.close();
      } else {
        this.initialValue = this.form.value;
        tabs.select('comments');
        this.fetchData();
      }
    });
  }

  delete(item: any) {
    let isStatus = item.isStatus;
    return super.delete(item).add(() => {
      if (isStatus) {
        this.person.status = null;
      }
      this.person.commentsCount--;
      this.fetchData();
    });
  }

  startEditing(item: any, tabs: any) {
    tabs.select('add');
    this.initialValue = item;
    this.form.setValue(this.enableEditing(item));
  }

  fetchData() {
    this.commentService.getAll(this.person.login).subscribe((comments: any[]) => {
      this.status = '';
      this.comments = comments
        .reduce((result, comment) => {
            if (comment.isStatus) {
              this.status = comment;
            } else {
              result.push(comment);
            }
            return result;
          }, []);
      this.aggregated = Array.from(this.comments);
      if (this.status) {
        this.aggregated.unshift(this.status);
      }
      this.activeTab = 'comments';
      this.form.reset({isStatus: !this.status});
    });
  }

  show(person: any) {
    this.items = [];
    this.skills = null;
    this.skillsInfo = null;
    this.carreer = {};

    this.person = person;
    this.modalRef = this.modalService.open(this.content, {size: 'lg', beforeDismiss: () => this.isSafeToProceed()});
    this.fetchData();
  }

  hasChanges() {
    let newValue = this.form.value;
    return ['source', 'text', 'isStatus'].some(
      key => (this.initialValue[key] || null) !== (newValue[key] || null)
    );
  }

  get isFormActive(): boolean {
    return this.activeTab == 'add';
  }

  isSafeToProceed() {
    return !this.isFormActive || !this.hasChanges() || confirm(discardConfirmation);
  }

  hasSkills(person): boolean {
    return person && !person.isDemand && !person.isHiree;
  }

  isCarreerFetched(): boolean {
    return Object.keys(this.carreer).length > 0;
  }
}