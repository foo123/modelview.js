!function(window, Storage, ModelView) {
"use strict";

var Model, View,
    TypeCast = ModelView.Type.Cast, Validate = ModelView.Validation.Validate,
    STORAGE_KEY = "modelview_todomvc", STORAGE_INTERVAL = 1000, KEY_ENTER = 13;

function initModelAutoStorage(key, interval)
{
    interval = interval || STORAGE_INTERVAL;
    // if supports localStorage
    if (Storage.isSupported && key)
    {
        var storeModelParams = function storeModelParams() {
            // should handle sub-models correctly as single json output
            Storage.set(key, Model.serialize());
            setTimeout(storeModelParams, interval);
        };
        setTimeout(storeModelParams, interval);
        return true;
    }
    return false;
}

function updateModelFromStorage(key)
{
    // if supports localStorage
    if (Storage.isSupported && key)
    {
        var storedOptions = Storage.get(key);
        if (storedOptions)
        {
            // reset any editing flags
            storedOptions.todoList.todos.forEach(todo => {todo.editing = false;});
            Model.set('displayMode', storedOptions.displayMode);
            Model.set('todoList', storedOptions.todoList);
            return true;
        }
    }
    return false;
}

function timeSince(time)
{
  var seconds = Math.floor((new Date().getTime() - time) / 1000), interval;
  interval = seconds / 31536000;
  if (interval > 1) return String(Math.floor(interval)) + " year(s) ago";
  interval = seconds / 2592000;
  if (interval > 1) return String(Math.floor(interval)) + " month(s) ago";
  interval = seconds / 86400;
  if (interval > 1) return String(Math.floor(interval)) + " day(s) ago";
  interval = seconds / 3600;
  if (interval > 1) return String(Math.floor(interval)) + " hour(s) ago";
  interval = seconds / 60;
  if (interval > 1) return String(Math.floor(interval)) + " minute(s) ago";
  return interval < 5 ? "just now" : String(Math.floor(seconds)) + " second(s) ago";
}

function route(displayMode)
{
    if (displayMode)
    {
        if ('#/' === displayMode.slice(0, 2)) displayMode = displayMode.slice(2);
        Model.set('displayMode', displayMode, true);
    }
}


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
    ,'todoList.todos.*.title': TypeCast.STR
    ,'todoList.todos.*.completed': TypeCast.BOOL
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
                return this.$data.todoList.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.$data.todoList.todos.filter(todo => todo.completed);
            default:
                return this.$data.todoList.todos;
        }
    }
    ,'todoList.todos.active': function() {
        return this.$data.todoList.todos.filter(todo => !todo.completed);
    }
    ,'todoList.todos.completed': function() {
        return this.$data.todoList.todos.filter(todo => todo.completed);
    }
    ,'todoList.allCompleted': function() {
        var visible = this.get('todoList.display'), completed = visible.filter(todo => todo.completed);
        return 0 < visible.length && visible.length === completed.length;
    }
})
;

View = new ModelView.View('todoview')
.model(Model)
.template(document.getElementById('content').innerHTML)
.autovalidate(false)
.autobind(false)
.livebind(true)
.components({
    Todo: new ModelView.View.Component(document.getElementById('todo-component').innerHTML)
})
.actions({
    addTodo: function(evt, el) {
        var title = el.value.trim();

        if (title.length )
        {
            Model.$data.todoList.todos.unshift({
                uuid: ModelView.UUID('todo'),
                title: title,
                time: new Date().getTime(),
                completed: false,
                editing: false
            });
            Model.$data.todoList.active++;
            Model.notify('todoList');
        }
    }
    ,allCompleted: function(evt, el) {
        var completed, visible;

        visible = Model.get('todoList.display');
        completed = visible.filter(todo => todo.completed);

        if (completed.length === visible.length)
        {
            // if all completed on current filter, uncomplete them
            visible.forEach(todo => {todo.completed = false;});
            Model.$data.todoList.completed -= completed.length;
            Model.$data.todoList.active += completed.length;
            Model.notify('todoList');
        }
        else
        {
            // complete visible todos on current filter
            visible.forEach(todo => {
                if (!todo.completed)
                {
                    todo.completed = true;
                    Model.$data.todoList.completed++;
                    Model.$data.todoList.active--;
                }
            })
            Model.notify('todoList');
        }
    }
    ,removeCompleted: function(evt, el){
        Model.$data.todoList.todos = Model.$data.todoList.todos.filter(todo => !todo.completed);
        Model.$data.todoList.completed = 0;
        Model.$data.todoList.active = Model.$data.todoList.todos.length;
        Model.notify('todoList');
    }
    ,edit: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid === $todo.getAttribute('todo-id'))[0] : null;

        if (todo && !todo.editing)
        {
            $todo.classList.add('editing');
            todo.editing = true;
            setTimeout(() => {$todo.querySelector('.edit').focus();}, 10);
        }
    }
    ,stopEditing: function(evt, el) {
        var title, $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid === $todo.getAttribute('todo-id'))[0] : null;

        if (todo && todo.editing)
        {
            if (evt.keyCode && KEY_ENTER !== evt.keyCode) return;
            title = el.value.trim();
            if (!title.length)
            {
                // remove
                Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(todo), 1);
                if (todo.completed) Model.$data.todoList.completed--;
                else Model.$data.todoList.active--;
                Model.notify('todoList');
            }
            else
            {
                // update
                todo.editing = false;
                todo.title = title;
                $todo.classList.remove('editing');
                Model.notify('todoList');
            }
        }
    }
    ,complete: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid === $todo.getAttribute('todo-id'))[0] : null;

        if (!todo) return;

        if (!todo.completed && el.checked)
        {
            todo.completed = true;
            Model.$data.todoList.completed++;
            Model.$data.todoList.active--;
            Model.notify('todoList');
        }
        else if (todo.completed && !el.checked)
        {
            todo.completed = false;
            Model.$data.todoList.completed--;
            Model.$data.todoList.active++;
            Model.notify('todoList');
        }
    }
    ,remove: function(evt, el) {
        var $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid === $todo.getAttribute('todo-id'))[0] : null;

        if (todo)
        {
            // remove
            Model.$data.todoList.todos.splice(Model.$data.todoList.todos.indexOf(todo), 1);
            if (todo.completed) Model.$data.todoList.completed--;
            else Model.$data.todoList.active--;
            Model.notify('todoList');
        }
    }
})
.bind(['change', 'click', 'dblclick', 'blur'/*'focusout'*/], document.getElementById('todoapp'))
;
View.timeSince = function(time){
    return null!=time ? timeSince(time) : '';
};

// synchronize UI/View/Model
updateModelFromStorage(STORAGE_KEY);

window.addEventListener('hashchange', function() {route(location.hash);}, false);

if (location.hash) route(location.hash);
// auto-trigger
else location.hash = '#/' + Model.get('displayMode');

View.render();

initModelAutoStorage(STORAGE_KEY, STORAGE_INTERVAL);
}(window, Storage, ModelView);