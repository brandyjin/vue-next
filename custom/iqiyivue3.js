console.log('vue3')

const target = {
    name: 'jtt',
    age: '29'
}

const proxy = new Proxy(target, {
    get (target, key, receiver) {
        return Reflect.get(target, key, receiver)
    },
    set (target, key, value, receiver) {
        Reflect.set(target, key, value + 'iqiyi', receiver)
    }
})

console.log(proxy.name)
target.name = 'shiyan'
console.log(proxy.name)