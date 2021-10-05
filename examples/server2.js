var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {items:new ModelView.Model.Collection(['Item1','Item2'])}))
    .components({
        'Item': new ModelView.View.Component('Item', `<li title={props}>{props}</li>`)
    })
    .template(`<ul>{view.model().get('items').mapTo(item => (<Item props={item}/>))}</ul>`)
    .livebind(true)
;

view.model().get('items').reset().set(1, 'new Item');
console.log(view.render());
