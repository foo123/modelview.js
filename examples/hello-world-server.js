var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
        'Hello': ModelView.View.Component('Hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().getVal('msg')}</div>`)
    })
    .template(`<Hello/>`)
    .livebind(true)
;

var viewSimple = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .template(`<div title="Hello {msg}">Hello {msg}</div>`)
    .livebind('text')
;

var viewWithRouter = new ModelView.View('view')
    .model(new ModelView.Model('model', {}))
    .components({
        'Hello': ModelView.View.Component('Hello', `<div title={'Hello ' + data.msg}>Hello {data.msg}</div>`)
    })
    .template(`{view.router({
        type:"hash",
        caseSensitive: false,
        routes:{
            "/": ()=>(<h1>Index</h1>),
            "/HELLO/:msg": (match)=>(<Hello data={match}/>)
        },
        fail: ()=>(<h1>404</h1>)
    })}`)
    .option('router.location', {path:'/', hash:'#/hello/Server-Side-Rendering'})
    .livebind(true)
;

console.log(view.render());
console.log(viewSimple.render());
console.log(viewWithRouter.render());