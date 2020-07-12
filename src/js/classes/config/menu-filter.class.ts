export class MenuFilter
{
  id : number;
  label : string;
  type : string;
  field : string;
  subtype : string;
  currentValue : any = {};
  contracted : boolean = false; // only label visible, need to click to expand
  options : any = {};

  constructor(data: any)
  {
    for(let field in data) {
      if (['id', 'label', 'type', 'field', 'subtype', 'currentValue', 'contracted'].indexOf(field) > -1)
        this[field] = data[field];
      else
        this.options[field] = data[field];
    }
    if (this.type) this.type = this.type.replace('gogo_', ''); // remove gogo prefix used in backend

    if (this.type == "date") {
      if (this.options.views && !$.isArray(this.options.views)) this.options.views = this.options.views.split(' ')
      if (!this.options.views) this.options.views = ['day', 'week', 'month', 'range'];
      if (this.options.views.indexOf(this.options.defaultView) == -1) this.options.views.push(this.options.defaultView);
    }
  }
}