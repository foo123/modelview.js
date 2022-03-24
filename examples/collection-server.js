var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {items:new ModelView.Model.Collection([
            {label: 'item1', tags: new ModelView.Model.Collection(['tag1', 'tag2'])},
            {label: 'item2', tags: new ModelView.Model.Collection(['tag3', 'tag2'])},
            {label: 'item3', tags: new ModelView.Model.Collection(['tag4', 'tag5'])},
            {label: 'item4', tags: new ModelView.Model.Collection(['tag6', 'tag1'])}
        ])}))
    .components({
        'Tag': ModelView.View.Component('Tag', `<span>{props},</span>`),
        'Item': ModelView.View.Component('Item', `<li title={props.label}>{props.label} &nbsp; {props.tags.mapTo(tag => (<Tag props={tag}/>))}</li>`)
    })
    .template(`<ul>{view.model().get('items').mapTo(item => (<Item props={item}/>))}</ul>`)
    .livebind(true)
;

var viewSimple = new ModelView.View('view')
    .model(new ModelView.Model('model', {items:new ModelView.Model.Collection([
            {label: 'item1', tags: new ModelView.Model.Collection(['tag1', 'tag2'])},
            {label: 'item2', tags: new ModelView.Model.Collection(['tag3', 'tag2'])},
            {label: 'item3', tags: new ModelView.Model.Collection(['tag4', 'tag5'])},
            {label: 'item4', tags: new ModelView.Model.Collection(['tag6', 'tag1'])}
        ])}))
    .template(`<ul><!--foreach {items}--><li title="{.label}">{.label} &nbsp; <!--foreach {.tags}--><span>{.},</span><!--/foreach--></li><!--/foreach--></ul>`)
    .livebind('text')
;

console.log(view.render());
console.log(viewSimple.render());
