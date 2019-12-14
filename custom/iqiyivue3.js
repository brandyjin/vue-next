console.log('vue3')

const target = {
  name: 'jtt',
  age: '29'
}
const effectStack = []
const depsMap = new Map()
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    const effect = effectStack[effectStack.length - 1]
    // 一个key可能对应多个effect
    let dep = depsMap.get(key)
    if (dep === void 0) {
      depsMap.set(key, (dep = new Set()))
    }
    depsMap.set(key, dep)
    dep.add(effect)
    return Reflect.get(target, key, receiver) //get
  },
  set(target, key, value, receiver) {
    Reflect.set(target, key, value + 'iqiyi', receiver)
    const effects = new Set()
    const deps = depsMap.get(key)
    // set的时候变成了数组？
    deps.forEach(dep => {
      effects.add(dep)
    })
    const run = effect => {
      effect()
    }
    // 通过set赋值，通过set取值
    effects.forEach(run)
  }
})
function effect(fn, options = {}) {
  const effect = (...args) => {
    return run(effect, fn, args)
  }
  if (!options.lazy) {
    effect()
  }
  return effect
}

function run(effect, fn, args) {
  if (!effectStack.includes(effect)) {
    effectStack.push(effect)
    return fn(args)
  } else {
    fn(args)
  }
}

effect(() => {
  console.log('i am effect', proxy.name)
})

const lazyeffct = effect(
  () => {
    console.log('i am lazy effect', proxy.name)
  },
  {
    lazy: true
  }
)

// effect(() => {
//     lazyeffct()
// })

// lazyeffct()
proxy.name = 'shiyan'
