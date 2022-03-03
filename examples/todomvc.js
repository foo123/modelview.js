!function(window, Storage, AreaSortable, ModelView) {
"use strict";

function debounce(f, wait, immediate)
{
    var timeout;
    return function() {
        var ctx = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) f.apply(ctx, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) f.apply(ctx, args);
    };
}

function disableScroll()
{
    // Get the current page scroll position
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0,
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    // if any scroll is attempted, set this to the previous value
    window.onscroll = function() {window.scrollTo(scrollLeft, scrollTop);};
}
function enableScroll()
{
    window.onscroll = function() {};
}

function autoStoreModel()
{
    // if supports localStorage
    if (Storage.isSupported)
    {
        const todoList = {
            todos: Model.get('todoList.todos').map(todo => ({
                uuid: todo.uuid.val(),
                title: todo.title.val(),
                completed: todo.completed.val(),
                time: todo.time
            }))
            ,active: Model.get('todoList.active')
            ,completed: Model.get('todoList.completed')
        };
        Storage.set(STORAGE_KEY, {todoList});
        return true;
    }
    return false;
}

function updateModelFromStorage()
{
    // if supports localStorage
    if (Storage.isSupported)
    {
        var storedOptions = Storage.get(STORAGE_KEY);
        if (storedOptions)
        {
            // reset any editing flags
            storedOptions.todoList.todos.forEach(todo => {
                todo.editing = false;
                todo.uuid = Value(todo.uuid);
                todo.title = Value(todo.title);
                todo.completed = Value(todo.completed);
                todo.className = Value('todo' + (todo.completed.val() ? ' completed' : ''), null, todo.completed.dirty());
            });
            Model.set('todoList', storedOptions.todoList);
            return true;
        }
    }
    return false;
}

function timeSince(time)
{
  var seconds = Math.floor((new Date().getTime() - time) / 1000),
    then = 0 > seconds ? " later" : " ago",
    now = 0 > seconds ? "about now" : "just now",
    interval;
  seconds = Math.abs(seconds);
  interval = Math.floor(seconds / 31536000);
  if (interval > 0) return String(interval) + " " + (1===interval?'year':'years') + then;
  interval = Math.floor(seconds / 2592000);
  if (interval > 0) return String(interval) + " " + (1===interval?'month':'months') + then;
  interval = Math.floor(seconds / 86400);
  if (interval > 0) return String(interval) + " " + (1===interval?'day':'days') + then;
  interval = Math.floor(seconds / 3600);
  if (interval > 0) return String(interval) + " " + (1===interval?'hour':'hours') + then;
  interval = Math.floor(seconds / 60);
  if (interval > 0) return String(interval) + " " + (1===interval?'minute':'minutes') + then;
  interval = Math.floor(seconds);
  return interval < 30 ? now : String(interval) + " seconds" + then;
}

function route(displayMode)
{
    if (displayMode)
    {
        if ('#/' === displayMode.slice(0, 2)) displayMode = displayMode.slice(2);
        Model.set('displayMode', displayMode, true);
    }
}

var Model, View, Value = ModelView.Model.Value, TypeCast = ModelView.Type.Cast, Validate = ModelView.Validation.Validate,
    STORAGE_KEY = "modelview_todomvc", KEY_ENTER = 13, autostore = debounce(autoStoreModel, 500);

// ModelView for App
Model = new ModelView.Model('model', {
    displayMode: 'all'
    ,todoList: {
        todos: []
        ,active: 0
        ,completed: 0
    }
})
.types({
    'displayMode': function(v) {return String(v).trim().toLowerCase();}
    //,'todoList.todos.*.title': TypeCast.STR
    //,'todoList.todos.*.completed': TypeCast.BOOL
})
.validators({
    'displayMode': Validate.IN('all', 'active', 'completed')
})
.getters({
    'todoList.all': function() {
        return this.$data.todoList.todos.length;
    }
    ,'todoList.display': function() {
        switch(this.$data.displayMode)
        {
            case 'active':
                return this.$data.todoList.todos.filter(todo => !todo.completed.val());
            case 'completed':
                return this.$data.todoList.todos.filter(todo => todo.completed.val());
            default:
                return this.$data.todoList.todos;
        }
    }
    ,'todoList.todos.active': function() {
        return this.$data.todoList.todos.filter(todo => !todo.completed.val());
    }
    ,'todoList.todos.completed': function() {
        return this.$data.todoList.todos.filter(todo => todo.completed.val());
    }
    ,'todoList.allCompleted': function() {
        var visible = this.get('todoList.display'), completed = visible.filter(todo => todo.completed.val());
        return 0 < visible.length && visible.length === completed.length;
    }
})
.on('change', function(evt, data){
    if ('todoList' === data.key.slice(0, 8))
        autostore();
})
;

View = new ModelView.View('todoview')
.model(Model)
.template(document.getElementById('content').innerHTML)
.autovalidate(false)
.autobind(false)
.livebind(true)
.components({
    Todo: new ModelView.View.Component(
        'Todo',
        document.getElementById('TodoComponent').innerHTML,
        {
            changed: (_old, _new) => (_old !== _new) || _new.uuid.dirty() || _new.title.dirty() || _new.completed.dirty()
        }
    )
})
.context({
    timeSince: function(time) {
        return null!=time ? timeSince(time) : '';
    }
})
.actions({
    addTodo: function(evt, el) {
        var title = el.value.trim(), todo;
        el.value = '';

        if (title.length )
        {
            Model.$data.todoList.todos.unshift(todo={
                uuid: Value(ModelView.UUID('todo')),
                title: Value(title),
                time: new Date().getTime(),
                completed: Value(false),
                className: Value('todo'),
                editing: false
            });
            Model.$data.todoList.active++;
            Model.notify('todoList');
        }
    }
    ,allCompleted: function(evt, el) {
        var completed, visible;

        visible = Model.get('todoList.display');
        completed = visible.filter(todo => todo.completed.val());

        if (completed.length === visible.length)
        {
            // if all completed on current filter, uncomplete them
            completed.forEach(todo => {
                todo.completed.set(false);
                todo.className = Value('todo' + (todo.completed.val() ? ' completed' : ''), null, todo.completed.dirty());
            });
            Model.$data.todoList.completed -= completed.length;
            Model.$data.todoList.active += completed.length;
            Model.notify('todoList');
        }
        else
        {
            // complete visible todos on current filter
            visible.forEach(todo => {
                if (!todo.completed.val())
                {
                    todo.completed.set(true);
                    todo.className = Value('todo' + (todo.completed.val() ? ' completed' : ''), null, todo.completed.dirty());
                    Model.$data.todoList.completed++;
                    Model.$data.todoList.active--;
                }
            })
            Model.notify('todoList');
        }
    }
    ,removeCompleted: function(evt, el){
        Model.$data.todoList.todos = Model.$data.todoList.todos.filter(todo => !todo.completed.val());
        Model.$data.todoList.completed = 0;
        Model.$data.todoList.active = Model.$data.todoList.todos.length;
        Model.notify('todoList');
    }
    ,edit: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo && !todo.editing)
        {
            $todo.classList.add('editing');
            todo.editing = true;
            setTimeout(() => {$todo.querySelector('.edit').focus();}, 10);
        }
    }
    ,stopEditing: function(evt, el) {
        var title, $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo && todo.editing)
        {
            if (evt.keyCode && KEY_ENTER !== evt.keyCode) return;
            title = el.value.trim();
            if (!title.length)
            {
                // remove
                Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(todo), 1);
                if (todo.completed.val()) Model.$data.todoList.completed--;
                else Model.$data.todoList.active--;
                Model.notify('todoList');
            }
            else
            {
                // update
                todo.editing = false;
                todo.title.set(title);
                $todo.classList.remove('editing');
                Model.notify('todoList');
            }
        }
    }
    ,complete: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (!todo) return;

        if (!todo.completed.val() && el.checked)
        {
            todo.completed.set(true);
            todo.className = Value('todo' + (todo.completed.val() ? ' completed' : ''), null, todo.completed.dirty());
            Model.$data.todoList.completed++;
            Model.$data.todoList.active--;
            Model.notify('todoList');
        }
        else if (todo.completed.val() && !el.checked)
        {
            todo.completed.set(false);
            todo.className = Value('todo' + (todo.completed.val() ? ' completed' : ''), null, todo.completed.dirty());
            Model.$data.todoList.completed--;
            Model.$data.todoList.active++;
            Model.notify('todoList');
        }
    }
    ,remove: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo)
        {
            // remove
            Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(todo), 1);
            if (todo.completed.val()) Model.$data.todoList.completed--;
            else Model.$data.todoList.active--;
            Model.notify('todoList');
        }
    }
    ,reorder: function($todo) {
        /*var todos = Model.$data.todoList.todos.reduce(function(todos, todo){
            todos[todo.uuid.val()] = todo;
            return todos;
        }, {});
        Model.$data.todoList.todos = [].map.call(document.getElementById('todo-list').children, function($todo){
            return todos[$todo.id];
        });*/
        var todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo)
        {
            Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(todo), 1);
            if ($todo.nextElementSibling)
            {
                Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.nextElementSibling.id)[0]), 0, todo);
            }
            else
            {
                Model.$data.todoList.todos.push(todo);
            }
            autoStoreModel();
        }
    }
})
.bind(['change', 'click', 'dblclick', 'blur'/*'focusout'*/], document.getElementById('todoapp'))
;

// synchronize UI/View/Model
updateModelFromStorage();

window.addEventListener('hashchange', function() {route(location.hash);}, false);

if (AreaSortable) AreaSortable('vertical', {
    container: 'todo-list',
    handle: 'drag',
    item: 'todo',
    activeItem: 'dnd-dragged',
    closestItem: 'dnd-closest',
    animationMs: 180,
    //onStart: disableScroll,
    onEnd: function($todo){
        //enableScroll()
        View.do_reorder($todo);
    }
});

if (location.hash) route(location.hash);
// auto-trigger
else location.hash = '#/all';

View.render();
}(window, Storage, window.AreaSortable, ModelView);