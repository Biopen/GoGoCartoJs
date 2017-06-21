import { AppModule } from "../app.module";

import { App } from "../gogocarto";
declare var nunjucks;

export class TemplateModule
{
	constructor()
	{
		// we can configure this path and the templates names from GoGoCarto
		// to override default templates
		// As default templates are precompiled into javascript templates.js file
		// if there is some templates we did not override, nunjucks will get the precompiled one
		nunjucks.configure('../src/views', { autoescape: true });
	}

	render(templateName : string, options : any) : string
	{
		let fileUrl = '';

		switch(templateName)
		{
			case 'layout': fileUrl = 'layout.html.njk'; break;
			case 'marker': fileUrl = 'components/marker.html.njk'; break;
			case 'categories-styles': fileUrl = 'categories-styles.html.njk'; break;
			case 'element-info-bar': fileUrl = 'components/element-info-bar/element-info-bar.html.njk'; break;
			default: console.error('No template associated to templateName', templateName);
		}

		return nunjucks.render(fileUrl, options);
	}
}