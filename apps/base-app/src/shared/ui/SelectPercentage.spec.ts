import { mount } from '@vue/test-utils'
import SelectPercentage from './SelectPercentage.vue'

describe('SelectPercentage', () => {
  const factory = ({ value }: { value: string }) => {
    const wrapper = mount(SelectPercentage, {
      propsData: {
        options: [
          { value: '1', text: 'option-one' },
          { value: '2', text: 'option-two' },
          { value: '3', text: 'option-three' }
        ],
        value
      }
    })
    const minusButton = wrapper.find('[data-test-id="btn-minus"]')
    const plusButton = wrapper.find('[data-test-id="btn-plus"]')

    return { wrapper, minusButton, plusButton }
  }

  it('should select currentValue', () => {
    const { wrapper } = factory({ value: '2' })

    expect(wrapper.find('[data-test-id=value]').text()).toBe('option-two')
  })

  describe('when "value" does not exist in options', () => {
    it('should select first option', () => {
      const { wrapper } = factory({ value: '4' })

      expect(wrapper.find('[data-test-id=value]').text()).toBe('option-one')
    })
  })

  describe('minus button', () => {
    describe('when clicked', () => {
      it('should emit "input" with the previous option', async () => {
        const { wrapper, minusButton } = factory({ value: '3' })

        await minusButton.trigger('click')

        expect(wrapper.emitted('input')).toEqual([['2']])
      })
    })

    describe('when does not have less options', () => {
      it('should be disabled', () => {
        const { minusButton } = factory({ value: '1' })

        expect(minusButton.attributes('disabled')).toBeTruthy()
      })

      it('should not emit "input"', async () => {
        const { wrapper, minusButton } = factory({ value: '1' })

        await minusButton.trigger('click')

        expect(wrapper.emitted('input')).toBeUndefined()
      })
    })
  })

  describe('plus button', () => {
    describe('when clicked', () => {
      it('should emit "input" with the next option', async () => {
        const { wrapper, plusButton } = factory({ value: '1' })

        await plusButton.trigger('click')

        expect(wrapper.emitted('input')).toEqual([['2']])
      })
    })

    describe('when does not have more options', () => {
      it('should be disabled', () => {
        const { plusButton } = factory({ value: '3' })

        expect(plusButton.attributes('disabled')).toBeTruthy()
      })

      it('should not emit "input"', async () => {
        const { wrapper, plusButton } = factory({ value: '3' })

        await plusButton.trigger('click')

        expect(wrapper.emitted('input')).toBeUndefined()
      })
    })
  })
})
