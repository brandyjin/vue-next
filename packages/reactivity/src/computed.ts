import { effect, ReactiveEffect, effectStack } from './effect'
import { Ref, UnwrapRef } from './ref'
import { isFunction, NOOP } from '@vue/shared'

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: UnwrapRef<T>
}

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>
}

export type ComputedGetter<T> = () => T // 返回带值得getter
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>

// 传进来的参数是带返回值的方法
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly')
        }
      : NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  let dirty = true
  let value: T

  const runner = effect(getter, {
    lazy: true,
    // mark effect as computed so that it gets priority during trigger
    computed: true,
    scheduler: () => {
      dirty = true
    }
  })
  return {
    _isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    // computed.value的时候执行
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      // When computed effects are accessed in a parent effect, the parent
      // should track all the dependencies the computed property has tracked.
      // This should also apply for chained computed properties.
      trackChildRun(runner)
      return value
    },
    set value(newValue: T) {
      setter(newValue)
    }
  } as any
}

function trackChildRun(childRunner: ReactiveEffect) {
  if (effectStack.length === 0) {
    return
  }
  // parent是什么概念？  调用了computed属性的方法，可能是watch、effect
  // parentRunner 取出最新一次调用的effect（调用computed属性的parent）
  const parentRunner = effectStack[effectStack.length - 1]

  // childRunner is （）=> T
  // cr.deps 实在get的时候时候加的，和 reactive.key 关联的effects
  // dep是取出所有和 computed中使用的reactive key关联的effects。
  for (let i = 0; i < childRunner.deps.length; i++) {
    const dep = childRunner.deps[i]
    // 如果其中没有parentRunner，则关联。
    if (!dep.has(parentRunner)) {
      dep.add(parentRunner)
      parentRunner.deps.push(dep)
    }
  }
}
