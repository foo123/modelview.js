var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
        'hello': new ModelView.View.Component('hello', `<div title="Hello {%= view.model().get('msg') %}">Hello {%= view.model().get('msg') %}</div>`)
    })
    .template(`{%= view.component('hello') %}`)
    .livebind(true)
;

var viewText = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .template(`<div title="Hello {%= msg %}">Hello {%= msg %}</div>`)
    .livebind('text')
;

console.log(view.render());
console.log(viewText.render());