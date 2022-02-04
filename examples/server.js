var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
        'Hello': ModelView.View.Component('Hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().getVal('msg')}</div>`)
    })
    .template(`<Hello/>`)
    .livebind(true)
;

var viewText = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .template(`<div title="Hello {msg}">Hello {msg}</div>`)
    .livebind('text')
;

var viewWithRouter = new ModelView.View('view')
    .model(new ModelView.Model('model', {}))
    .components({
        'Hello': ModelView.View.Component('Hello', `<div title={'Hello ' + props.msg}>Hello {props.msg}</div>`)
    })
    .template(`{view.router({
        type:"hash",
        caseSensitive: false,
        routes:{
            "/": ()=>(<h1>Index</h1>),
            "/HELLO/:msg": (match)=>(<Hello props={match}/>)
        },
        fail: ()=>(<h1>404</h1>)
    })}`)
    .livebind(true)
    .option('router.location', {path:'/', hash:'#/hello/Server-Side-Rendering'})
;

console.log(view.render());
console.log(viewText.render());
console.log(viewWithRouter.render());