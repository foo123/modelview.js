var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
        'hello': new ModelView.View.Component(`<div title="Hello {%= view.model().get('msg') %}">Hello {%= view.model().get('msg') %}</div>`)
    })
    .template(`{%= view.component('hello') %}`)
;

console.log(view.render());