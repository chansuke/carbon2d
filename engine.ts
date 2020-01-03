'use strict'

class Rectangle {
  x: number
  y: number
  width: number
  height: number

  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  hitTest(other) {
    const horizontal =
      other.x < this.x + this.width && this.x < other.x + other.width
    const vertical =
      other.y < this.y + this.height && this.y < other.y + other.height
    return horizontal && vertical
  }
}

class Sprite {
  image: string
  rectangle: number

  constructor(image, rectangle) {
    this.image = image
    this.rectangle = rectangle
  }
}

class AssetLoader {
  _promises: Array<Promise<unknown>>
  _assets: Map<string, HTMLImageElement>

  constructor() {
    this._promises = []
    this._assets = new Map<string, HTMLImageElement>()
  }

  addImage(name, url) {
    const img = new Image()
    img.src = url

    const promise = new Promise((resolve, reject) =>
      img.addEventListener('load', e => {
        this._assets.set(name, img)
        resolve(img)
      })
    )
    this._promises.push(promise)
  }

  loadAll() {
    return Promise.all(this._promises).then(p => this._assets)
  }

  get(name) {
    return this._assets.get(name)
  }
}

const assets = new AssetLoader()

class EventDispatcher {
  _eventListeners: {}

  constructor() {
    this._eventListeners = {}
  }

  addEventListener(type, callback) {
    if (this._eventListeners[type] === undefined) {
      this._eventListeners[type] = []
    }

    this._eventListeners[type].push(callback)
  }

  removeAllEventListener() {
    this._eventListeners = {}
  }

  dispatchEvent(type, event) {
    const listeners = this._eventListeners[type]
    if (listeners !== undefined) listeners.forEach(callback => callback(event))
  }
}

class GameEvent {
  _target: {}

  constructor(target) {
    this._target = target
  }
}

class Actor extends EventDispatcher {
  hitArea: { x: number; y: number }
  _hitAreaOffsetX: number // not `Number`
  _hitAreaOffsetY: number
  tags: string[]
  _x: number
  _y: number

  constructor(x, y, hitArea, tags = []) {
    super()
    this.hitArea = hitArea
    this._hitAreaOffsetX = hitArea.x
    this._hitAreaOffsetY = hitArea.y
    this.tags = tags

    this.x = x
    this.y = y
  }

  update(gameInfo, input) {}

  render(target) {}

  hasTag(tagName) {
    return this.tags.includes(tagName)
  }

  spawnActor(actor) {
    this.dispatchEvent('spawnactor', new GameEvent(actor))
  }

  destroy() {
    this.dispatchEvent('destroy', new GameEvent(this))
  }

  get x() {
    return this._x
  }

  get y() {
    return this._y
  }

  set x(value) {
    this._x = value
    this.hitArea.x = value + this._hitAreaOffsetX
  }

  set y(value) {
    this._y = value
    this.hitArea.y = value + this._hitAreaOffsetY
  }
}

class SpriteActor extends Actor {
  sprite: {
    rectangle: { x: string; y: string; width: string; height: string }
    image: string
  }
  width: string
  height: string

  constructor(x, y, sprite, hitArea, tags = []) {
    super(x, y, hitArea, tags)
    this.sprite = sprite
    this.width = sprite.rectangle.width
    this.height = sprite.rectangle.height
  }

  render(target) {
    const context = target.getContext('2d')
    const rect = this.sprite.rectangle
    context.drawImage(
      this.sprite.image,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    )
  }

  isOutOfBounds(boundRect) {
    const actorLeft = this.x
    const actorRight = this.x + this.width
    const actorTop = this.y
    const actorBottom = this.y + this.height

    const horizontal = actorRight < boundRect.x || actorLeft > boundRect.width
    const vertical = actorBottom < boundRect.y || actorTop > boundRect.height

    return horizontal || vertical
  }
}

class Input {
  keyMap: string
  prevKeyMap: string

  constructor(keyMap, prevKeyMap) {
    this.keyMap = keyMap
    this.prevKeyMap = prevKeyMap
  }

  _getKeyFromMap(keyName, map) {
    if (map.has(keyName)) {
      return map.get(keyName)
    } else {
      return false
    }
  }

  _getPrevKey(keyName) {
    return this._getKeyFromMap(keyName, this.prevKeyMap)
  }

  getKey(keyName) {
    return this._getKeyFromMap(keyName, this.keyMap)
  }

  getKeyDown(keyName) {
    const prevDown = this._getPrevKey(keyName)
    const currentDown = this.getKey(keyName)
    return !prevDown && currentDown
  }

  getKeyUp(keyName) {
    const prevDown = this._getPrevKey(keyName)
    const currentDown = this.getKey(keyName)
    return prevDown && !currentDown
  }
}
