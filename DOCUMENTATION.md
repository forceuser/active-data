## Classes

<dl>
<dt><a href="#Manager">Manager</a></dt>
<dd><p>Reactive data manager that observes data changes and performs actions in response.
Observation is lazy, data is updated only when required.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ManagerOptions">ManagerOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Observable">Observable</a></dt>
<dd><p>Object or array that will be observed for changes.
When the property of type <a href="Object">Object</a> or <a href="Array">Array</a> of <a href="#Observable">Observable</a>
are accessed it automaticaly becomes <a href="#Observable">Observable</a></p>
</dd>
<dt><a href="#UpdatableFunction">UpdatableFunction</a></dt>
<dd><p>function that caches result of its execution and returns cached value if function state is valid
function state can be invalidated if some of <a href="#Observable">Observable</a> objects that were accessed on previous call are changed</p>
</dd>
<dt><a href="#UpdatableSettings">UpdatableSettings</a> : <code>Object</code></dt>
<dd><p>Settings to create <a href="#UpdatableFunction">UpdatableFunction</a></p>
</dd>
</dl>

<a name="Manager"></a>

## Manager
Reactive data manager that observes data changes and performs actions in response.
Observation is lazy, data is updated only when required.

**Kind**: global class  

* [Manager](#Manager)
    * [new exports.Manager([options])](#new_Manager_new)
    * [.mapProperties(source, target, [propertyKeys])](#Manager+mapProperties)
    * [.setOptions([options])](#Manager+setOptions)
    * [.getOptions()](#Manager+getOptions) ⇒ [<code>ManagerOptions</code>](#ManagerOptions)
    * [.makeObservable(dataSource)](#Manager+makeObservable) ⇒ [<code>Observable</code>](#Observable)
    * [.makeUpdatable(fn, settings)](#Manager+makeUpdatable) ⇒ [<code>UpdatableFunction</code>](#UpdatableFunction)
    * [.makeComputed(target, propertyKey, getter, [setter])](#Manager+makeComputed)
    * [.makeReaction(call, run)](#Manager+makeReaction) ⇒ [<code>UpdatableFunction</code>](#UpdatableFunction)
    * [.getDataSource()](#Manager+getDataSource) ⇒ <code>Object</code> \| <code>Array</code>
    * [.isObservable(target)](#Manager+isObservable)
    * [.run([action])](#Manager+run)
    * [.runDeferred([action], [timeout])](#Manager+runDeferred)

<a name="new_Manager_new"></a>

### new exports.Manager([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>ManagerOptions</code>](#ManagerOptions) | Manager options |

<a name="Manager+mapProperties"></a>

### manager.mapProperties(source, target, [propertyKeys])
Maps properties from `source` to `target`

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Description |
| --- | --- | --- |
| source | [<code>Observable</code>](#Observable) |  |
| target | [<code>Observable</code>](#Observable) |  |
| [propertyKeys] | <code>Array</code> \| <code>String</code> | property keys of `source` object to map to `target` object, if not set then all keys will be mapped |

<a name="Manager+setOptions"></a>

### manager.setOptions([options])
Dynamically sets the options of the data manager

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>ManagerOptions</code>](#ManagerOptions) | Manager options |

<a name="Manager+getOptions"></a>

### manager.getOptions() ⇒ [<code>ManagerOptions</code>](#ManagerOptions)
Gets the options of the data manager

**Kind**: instance method of [<code>Manager</code>](#Manager)  
**Returns**: [<code>ManagerOptions</code>](#ManagerOptions) - Manager options  
<a name="Manager+makeObservable"></a>

### manager.makeObservable(dataSource) ⇒ [<code>Observable</code>](#Observable)
Creates [Observable](#Observable) object for the specified dataSource

**Kind**: instance method of [<code>Manager</code>](#Manager)  
**Returns**: [<code>Observable</code>](#Observable) - observable object  

| Param | Type | Description |
| --- | --- | --- |
| dataSource | <code>Object</code> \| <code>Array</code> | data source |

<a name="Manager+makeUpdatable"></a>

### manager.makeUpdatable(fn, settings) ⇒ [<code>UpdatableFunction</code>](#UpdatableFunction)
Creates [UpdatableFunction](#UpdatableFunction)
Used for internal purposes

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | function that will be called from [UpdatableFunction](#UpdatableFunction) |
| settings | [<code>UpdatableSettings</code>](#UpdatableSettings) | settings for updatable function |

<a name="Manager+makeComputed"></a>

### manager.makeComputed(target, propertyKey, getter, [setter])
Creates computed property

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Object</code> | The object for which the calculated property will be created |
| propertyKey | <code>String</code> | Name of calculated property |
| getter | <code>function</code> | The function to be executed when accessing the property |
| [setter] | <code>function</code> | The function that will be executed when setting the value of the property |

<a name="Manager+makeReaction"></a>

### manager.makeReaction(call, run) ⇒ [<code>UpdatableFunction</code>](#UpdatableFunction)
Creates [UpdatableFunction](#UpdatableFunction) that will be automatically
executed when one of it's dependencies are changed

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| call | <code>function</code> |  | Function to call [UpdatableFunction](#UpdatableFunction) 'call' will be executed when some of [Observable](#Observable) that was used on previous call are changed |
| run | <code>Boolean</code> | <code>true</code> | Run function immediately after it's registration If [ManagerOptions.immediateReaction](ManagerOptions.immediateReaction) is not set then it will be called on the next tick. |

<a name="Manager+getDataSource"></a>

### manager.getDataSource() ⇒ <code>Object</code> \| <code>Array</code>
Returns original source of [Observable](#Observable)

**Kind**: instance method of [<code>Manager</code>](#Manager)  
<a name="Manager+isObservable"></a>

### manager.isObservable(target)
Checks if the object is [Observable](#Observable)

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type |
| --- | --- |
| target | [<code>Observable</code>](#Observable) \| <code>Object</code> \| <code>Array</code> | 

<a name="Manager+run"></a>

### manager.run([action])
Executes all reactions that marked with invalid state

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Description |
| --- | --- | --- |
| [action] | <code>function</code> | Changes of [Observable](#Observable) that happens inside 'action' function will not trigger immediate execution of dependent reactions If [ManagerOptions.immediateReaction](ManagerOptions.immediateReaction) is set then reactions will be executed after exiting the 'action' function |

<a name="Manager+runDeferred"></a>

### manager.runDeferred([action], [timeout])
Executes all reactions that marked as invalid
Unlike [run](run), 'runDeferred' makes it not immediately but after 'timeout'

**Kind**: instance method of [<code>Manager</code>](#Manager)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [action] | <code>function</code> |  | changes of [Observable](#Observable) that happens inside 'action' function will not trigger immediate execution of dependent reactions |
| [timeout] | <code>Number</code> | <code>0</code> | reactions execution delay |

<a name="ManagerOptions"></a>

## ManagerOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [immediateReaction] | <code>Boolean</code> | <code>false</code> | if set to `true` reactions will be executed immediately on same event loop otherwise it will be executed after zero timeout (on next event loop) |
| [enabled] | <code>Boolean</code> | <code>true</code> | state of data manager, if it is disabled then reactions will not be executed |

<a name="Observable"></a>

## Observable
Object or array that will be observed for changes.
When the property of type [Object](Object) or [Array](Array) of [Observable](#Observable)
are accessed it automaticaly becomes [Observable](#Observable)

**Kind**: global typedef  
<a name="UpdatableFunction"></a>

## UpdatableFunction
function that caches result of its execution and returns cached value if function state is valid
function state can be invalidated if some of [Observable](#Observable) objects that were accessed on previous call are changed

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| uninit | <code>function</code> | 

<a name="UpdatableSettings"></a>

## UpdatableSettings : <code>Object</code>
Settings to create [UpdatableFunction](#UpdatableFunction)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| onInvalidate | <code>function</code> | callback function that will be executed when UpdatableState of [UpdatableFunction](#UpdatableFunction) becomes invalid |
| onUninit | <code>function</code> | callback function that will be executed after [UpdatableFunction#uninit](UpdatableFunction#uninit) is called |

