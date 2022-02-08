!function(window, Storage, ModelView) {
"use strict";

function DnDSortable(opts)
{
    var self = this;
    if (!(self instanceof DnDSortable)) return new DnDSortable(opts);
    self.opts = opts || {};
    self.init();
}
DnDSortable.prototype = {
    constructor: DnDSortable
    ,opts: null
    ,handler: null
    ,dispose: function() {
        var self = this;
        if (self.handler)
        {
            document.removeEventListener('touchstart', self.handler, true);
            document.removeEventListener('mousedown', self.handler, true);
        }
        self.handler = null;
        self.opts = null;
        return self;
    }
    ,init: function() {
        if (!Object.prototype.hasOwnProperty.call(window.Element.prototype, '$dndRect'))
            window.Element.prototype.$dndRect = null;

        var self = this, draggingEle, handlerEle, parent, parentRect,
            y0, lastY, isDraggingStarted = false, closestEle, dir, moved;

        if (self.handler) return;

        var move = function(movedNode, refNode, dir) {
            var next, delta, pos, limitNode;
            if (0 > dir)
            {
                limitNode = movedNode.nextElementSibling;
                pos = movedNode.$dndRect.top;
                // Move `movedNode` before the `refNode`
                parent.insertBefore(movedNode, refNode);
                movedNode.$dndRect.top = refNode.$dndRect.top;
                delta = movedNode.$dndRect.height-refNode.$dndRect.height;
                while ((next = refNode.nextElementSibling) && (next !== limitNode))
                {
                    refNode.$dndRect.top = next.$dndRect.top+delta;
                    refNode.style.top = String(refNode.$dndRect.top-parentRect.top)+'px';
                    delta = refNode.$dndRect.height-next.$dndRect.height;
                    refNode = next;
                }
                refNode.$dndRect.top = pos+delta;
                refNode.style.top = String(refNode.$dndRect.top-parentRect.top)+'px';
            }
            else if (0 < dir)
            {
                limitNode = movedNode.previousElementSibling;
                pos = movedNode.$dndRect.top;
                // Move `movedNode` after the `refNode`
                if (refNode.nextElementSibling)
                    parent.insertBefore(movedNode, refNode.nextElementSibling);
                else
                    parent.appendChild(movedNode);
                movedNode.$dndRect.top = refNode.$dndRect.top;
                delta = movedNode.$dndRect.height-refNode.$dndRect.height;
                while ((next = refNode.previousElementSibling) && (next !== limitNode))
                {
                    refNode.$dndRect.top = next.$dndRect.top-delta;
                    refNode.style.top = String(refNode.$dndRect.top-parentRect.top)+'px';
                    delta = refNode.$dndRect.height-next.$dndRect.height;
                    refNode = next;
                }
                refNode.$dndRect.top = pos-delta;
                refNode.style.top = String(refNode.$dndRect.top-parentRect.top)+'px';
            }
       };

        var intersect = function(nodeA, nodeB) {
            var rectA = nodeA.getBoundingClientRect(), rectB = nodeB.getBoundingClientRect();
            if (rectA.top > rectB.top && rectA.top < rectB.top + rectB.height)
                return (rectA.top-rectB.top) / (rectB.height);
            else if (rectB.top > rectA.top && rectB.top < rectA.top + rectA.height)
                return (rectB.top-rectA.top) / (rectA.height);
            return 0;
        };

        var dragStart = self.handler = function(e) {
            if (isDraggingStarted || !e.target || !e.target.matches(self.opts.handle || '.dnd-handle')) return;
            handlerEle = e.target;
            draggingEle = handlerEle.closest(self.opts.item || '.dnd-item');
            if (!draggingEle) return;

            e.preventDefault();
            e.stopPropagation();
            parent = draggingEle.parentNode;

            if ('function' === typeof self.opts.onStart) self.opts.onStart(draggingEle);

            isDraggingStarted = true;
            closestEle = null;

            parentRect = parent.getBoundingClientRect();
            [].forEach.call(parent.children, function(el){
                var r = el.getBoundingClientRect();
                el.$dndRect = {top: r.top, left: r.left, width: r.width, height: r.height};
            });
            parent.classList.add(self.opts.container || 'dnd-container');
            parent.style.paddingBottom = String(parentRect.height) + 'px';
            parent.style.height = '0px';
            draggingEle.draggable = false; // disable native drag
            draggingEle.classList.add(self.opts.dragged || 'dnd-dragged');
            [].forEach.call(parent.children, function(el){
                el.style.position = 'absolute';
                el.style.top = String(el.$dndRect.top-parentRect.top)+'px';
                el.style.left = String(el.$dndRect.left-parentRect.left)+'px';
            });
            lastY = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientY : e.clientY;
            y0 = lastY + parentRect.top - draggingEle.$dndRect.top;
            // Set position for dragging element
            draggingEle.style.top = String((e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientY : e.clientY) - y0)+'px';

            // Attach the listeners to `document`
            document.addEventListener('touchmove', dragMove, false);
            document.addEventListener('touchend', dragEnd, false);
            document.addEventListener('touchcancel', dragEnd, false);
            document.addEventListener('mousemove', dragMove, false);
            document.addEventListener('mouseup', dragEnd, false);
        };

        var dragMove = throttle(function(e) {
            var prevEle, nextEle, hoverEle, p = 0, y, x;

            y = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientY : e.clientY;
            x = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientX : e.clientX;
            // Set position for dragging element
            draggingEle.style.top = String(y - y0)+'px';

            if (closestEle && ((-1 === dir && lastY < y) || (1 === dir && lastY > y)))
            {
                closestEle.classList.remove(self.opts.closest || 'dnd-closest');
                closestEle = null;
            }

            if (!closestEle)
            {
                hoverEle = document.elementsFromPoint(x, y).filter(function(el){
                    return (el !== draggingEle) && el.matches(self.opts.item || '.dnd-item');
                })[0];
                if (hoverEle && (p=intersect(draggingEle, hoverEle)))
                {
                    closestEle = hoverEle; dir = lastY < y ? 1 : -1; moved = false;
                }
            }

            /*if (!closestEle)
            {
                // User moves the dragging element to the top
                prevEle = draggingEle.previousElementSibling;
                if (prevEle && (p=intersect(draggingEle, prevEle)))
                {
                    closestEle = prevEle; dir = -1; moved = false;
                }
            }

            if (!closestEle)
            {
                // User moves the dragging element to the bottom
                nextEle = draggingEle.nextElementSibling;
                if (nextEle && (p=intersect(nextEle, draggingEle)))
                {
                    closestEle = nextEle; dir = 1; moved = false;
                }
            }*/

            lastY = y;
            
            if (closestEle)
            {
                p = p || intersect(draggingEle, closestEle);
                if (p)
                {
                    if (p >= 0.2)
                    {
                        closestEle.classList.add(self.opts.closest || 'dnd-closest');
                    }
                    else
                    {
                        closestEle.classList.remove(self.opts.closest || 'dnd-closest');
                    }
                    if ((p <= 0.5) && !moved)
                    {
                        moved = true;
                        move(draggingEle, closestEle, dir);
                    }
                }
                else
                {
                    closestEle.classList.remove(self.opts.closest || 'dnd-closest');
                    closestEle = null;
                }
            }
        }, 20);

        var dragEnd = function(e) {
            // Remove the handlers of `mousemove` and `mouseup`
            document.removeEventListener('touchmove', dragMove, false);
            document.removeEventListener('touchend', dragEnd, false);
            document.removeEventListener('touchcancel', dragEnd, false);
            document.removeEventListener('mousemove', dragMove, false);
            document.removeEventListener('mouseup', dragEnd, false);

            [].forEach.call(parent.children, function(el){
                el.$dndRect = null;
                el.style.removeProperty('position');
                el.style.removeProperty('top');
                el.style.removeProperty('left');
            });
            parent.style.removeProperty('padding-bottom');
            parent.style.removeProperty('height');
            parent.classList.remove(self.opts.container || 'dnd-container');
            if (closestEle) closestEle.classList.remove(self.opts.closest || 'dnd-closest');
            draggingEle.classList.remove(self.opts.dragged || 'dnd-dragged');

            if ('function' === typeof self.opts.onEnd) self.opts.onEnd(draggingEle);

            draggingEle = null;
            handlerEle = null;
            parent = null;
            parentRect = null;
            closestEle = null;
            isDraggingStarted = false;
        };

        document.addEventListener('touchstart', dragStart, true);
        document.addEventListener('mousedown', dragStart, true);
    }
};

function throttle(f, limit)
{
    var inThrottle = false;
    return function() {
        var args = arguments, context = this;
        if (!inThrottle)
        {
            f.apply(context, args);
            inThrottle = true;
            setTimeout(function(){inThrottle = false;}, limit);
        }
    };
}

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
  var seconds = Math.floor((new Date().getTime() - time) / 1000), interval;
  interval = Math.floor(seconds / 31536000);
  if (interval > 0) return String(interval) + " "+(1===interval?'year':'years')+" ago";
  interval = Math.floor(seconds / 2592000);
  if (interval > 0) return String(interval) + " "+(1===interval?'month':'months')+" ago";
  interval = Math.floor(seconds / 86400);
  if (interval > 0) return String(interval) + " "+(1===interval?'day':'days')+" ago";
  interval = Math.floor(seconds / 3600);
  if (interval > 0) return String(interval) + " "+(1===interval?'hour':'hours')+" ago";
  interval = Math.floor(seconds / 60);
  if (interval > 0) return String(interval) + " "+(1===interval?'minute':'minutes')+" ago";
  interval = Math.floor(seconds);
  return interval < 30 ? "just now" : String(interval) + " seconds ago";
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

DnDSortable({
    handle: '.drag',
    item: '.todo',
    onEnd: function($todo){
        View.do_reorder($todo);
    }
});

if (location.hash) route(location.hash);
// auto-trigger
else location.hash = '#/all';

View.render();
}(window, Storage, ModelView);