!function todomvc(window, Storage, AreaSortable, ModelView) {
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
        const storedOptions = Storage.get(STORAGE_KEY);
        if (storedOptions)
        {
            // reset any editing flags
            storedOptions.todoList.todos.forEach(todo => {
                todo.editing = false;
                todo.uuid = Value(todo.uuid);
                todo.title = Value(todo.title);
                todo.completed = Value(todo.completed);
                todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(todo.completed.dirty());
            });
            Model.set('todoList', storedOptions.todoList);
            return true;
        }
    }
    return false;
}

function timeSince(time)
{
    let seconds = Math.floor((new Date().getTime() - time) / 1000),
        then = 0 > seconds ? " later" : " ago",
        now = 0 > seconds ? "about now" : "just now",
        interval
    ;
    seconds = Math.abs(seconds);
    interval = Math.floor(seconds / 31536000);
    if (interval > 0) return [interval, (1 === interval ? 'year' : 'years'), then];
    interval = Math.floor(seconds / 2592000);
    if (interval > 0) return [interval, (1 === interval ? 'month' : 'months'), then];
    interval = Math.floor(seconds / 86400);
    if (interval > 0) return [interval, (1 === interval ? 'day' : 'days'), then];
    interval = Math.floor(seconds / 3600);
    if (interval > 0) return [interval, (1 === interval ? 'hour' : 'hours'), then];
    interval = Math.floor(seconds / 60);
    if (interval > 0) return [interval, (1 === interval ? 'minute' : 'minutes'), then];
    interval = Math.floor(seconds);
    return interval < 30 ? [now] : [interval, 'seconds', then];
}

function route(displayMode)
{
    if (displayMode)
    {
        if ('#/' === displayMode.slice(0, 2)) displayMode = displayMode.slice(2);
        Model.set('displayMode', displayMode, true);
    }
}

function setDelayedRender(f, t)
{
    if (timeout.id)
    {
        if (t < timeout.t)
        {
            clearTimeout(timeout.id);
            timeout.id = setTimeout(f, timeout.t=t);
        }
    }
    else
    {
        timeout.id = setTimeout(f, timeout.t=t);
    }
}
function clearDelayedRender()
{
    if (timeout.id) clearTimeout(timeout.id);
    timeout.id = null;
    timeout.t = 0;
}
function reRender()
{
    clearDelayedRender();
    View.render();
}

const Value = ModelView.Model.Value,
    TypeCast = ModelView.Type.Cast,
    Validate = ModelView.Validation.Validate,
    STORAGE_KEY = "modelview_todomvc",
    KEY_ENTER = 13,
    autostore = debounce(autoStoreModel, 500),
    timeout = {id: null, t: 0}
;

// ModelView for App
const Model = new ModelView.Model('model', {
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
    clearDelayedRender();
    if ('todoList' === data.key.slice(0, 8))
    {
        autostore();
    }
})
;

const View = new ModelView.View('todoview')
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
        if (null == time) return '';
        const t = timeSince(time), dur = t[0], unit = t[1];
        let dirty = false;
        if (null == unit || 'second' === unit || 'seconds' === unit)
        {
            setDelayedRender(reRender, 30*1000);
            dirty = true;
        }
        else if ('minute' === unit || 'minutes' === unit)
        {
            setDelayedRender(reRender, 1*60*1000);
            dirty = true;
        }
        else if ('hour' === unit || 'hours' === unit)
        {
            setDelayedRender(reRender, 60*60*1000);
            dirty = true;
        }
        else if ('day' === unit || 'days' === unit)
        {
            setDelayedRender(reRender, 24*60*60*1000);
            dirty = true;
        }
        return Value(t.join(' ')).dirty(dirty);
    }
})
.actions({
    addTodo: function(evt, el) {
        let title = el.value.trim(), todo = null;
        el.value = '';

        if (title.length)
        {
            Model.$data.todoList.todos.unshift(todo = {
                uuid: Value(ModelView.UUID('todo')),
                title: Value(title),
                time: new Date().getTime(),
                completed: Value(false),
                className: Value('todo'),
                editing: false
            });
            ++Model.$data.todoList.active;
            Model.notify('todoList');
        }
    }
    ,allCompleted: function(evt, el) {
        const visible = Model.get('todoList.display'),
            completed = visible.filter(todo => todo.completed.val())
        ;

        if (completed.length === visible.length)
        {
            // if all completed on current filter, uncomplete them
            completed.forEach(todo => {
                todo.completed.set(false);
                todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(todo.completed.dirty());
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
                    todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(todo.completed.dirty());
                    ++Model.$data.todoList.completed;
                    --Model.$data.todoList.active;
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
        let $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo && !todo.editing)
        {
            todo.editing = true;
            todo.className = Value('todo' + (todo.completed.val() ? ' completed editing' : ' editing')).dirty(true);
            $todo.classList.add('editing');
            setTimeout(() => {$todo.querySelector('.edit').focus();}, 10);
        }
    }
    ,stopEditing: function(evt, el) {
        let title, $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (todo && todo.editing)
        {
            if (evt.keyCode && (KEY_ENTER !== evt.keyCode)) return;
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
                todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(true);
                $todo.classList.remove('editing');
                todo.title.set(title);
                Model.notify('todoList');
            }
        }
    }
    ,complete: function(evt, el) {
        let $todo = el.closest('.todo'),
            todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

        if (!todo) return;

        if (!todo.completed.val() && el.checked)
        {
            todo.completed.set(true);
            todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(todo.completed.dirty());
            Model.$data.todoList.completed++;
            Model.$data.todoList.active--;
            Model.notify('todoList');
        }
        else if (todo.completed.val() && !el.checked)
        {
            todo.completed.set(false);
            todo.className = Value('todo' + (todo.completed.val() ? ' completed' : '')).dirty(todo.completed.dirty());
            Model.$data.todoList.completed--;
            Model.$data.todoList.active++;
            Model.notify('todoList');
        }
    }
    ,remove: function(evt, el) {
        let $todo = el.closest('.todo'),
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
        let todo = $todo ? Model.$data.todoList.todos.filter(todo => todo.uuid.val() == $todo.id)[0] : null;

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

window.addEventListener('hashchange', () => {route(location.hash);}, false);

if (AreaSortable) AreaSortable('vertical', {
    container: 'todo-list',
    handle: 'drag',
    item: 'todo',
    activeItem: 'dnd-dragged',
    closestItem: 'dnd-closest',
    animationMs: 180,
    autoscroll: true,
    onEnd: ($todo) => {View.do_reorder($todo);}
});

if (location.hash) route(location.hash);
// auto-trigger
else location.hash = '#/all';

View.render();
}(window, Storage, window.AreaSortable, ModelView);