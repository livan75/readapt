import { AnaliseTextFn, Liaison, Syllable } from '@readapt/text-engine'
import { ColoredItem, Settings } from '@readapt/settings'
import xor from 'lodash/xor'

interface Context {
  processedSyllables: number
}

const buildAdaptTextContentForText =
  (analyse: AnaliseTextFn) =>
  (htmlText: string, settings: Settings, liaisonsPhonemes: Set<string>): string => {
    const context: Context = {
      processedSyllables: 0
    }
    const adaptNodeForText = buildAdaptTextNodeForText(analyse, settings, liaisonsPhonemes, context)

    return adaptNodeForText(htmlText)
  }

/**
 * build adaptTextNode
 * adaptTextNode manipulates the DOM to add readapt styles and classes
 */
const buildAdaptTextNodeForText =
  (analyse: AnaliseTextFn, settings: Settings, liaisonsPhonemes: Set<string>, context: Context) =>
  (textToAdapt: string): string => {
    if (!hasTextRulesSettings(settings)) {
      return `${textToAdapt}`
    }

    const textEngineResult = analyse(textToAdapt, settings.language)
    const textAdapted = textToAdapt.split('').map((char: string, textIndex) => {
      const classList = []

      if (settings.syllableActive) {
        const syllable = isSyllable(textIndex, textEngineResult.syllables, context)
        if (syllable) {
          classList.push(syllable)
        }
      }

      if (settings.liaisonsActive && textEngineResult.liaisons) {
        const liaison = findLiaison(textIndex, textEngineResult.liaisons)
        if (liaison) {
          const [start, end, phoneme] = liaison
          liaisonsPhonemes.add(phoneme)
          if (start === textIndex) {
            classList.push('readapt-liaison-start', `readapt-liaison-${phoneme}`)
          } else if (start + 1 === textIndex) {
            classList.push('readapt-liaison-symbol')
          } else if (end === textIndex) {
            classList.push('readapt-liaison-end')
          }
        }
      }

      // phonemes
      let hasPhonemes = false
      const phoneme = textEngineResult.phonemes[textIndex]
      if (settings.phonemesActive && typeof phoneme === 'number') {
        const phonemeClasses = adaptPhoneme(settings, phoneme)
        hasPhonemes = phonemeClasses.length > 0
        classList.push(...phonemeClasses)
      }

      // letters
      if (settings.lettersActive && !hasPhonemes) {
        const letterClasses = adaptLetter(settings, char)
        classList.push(...letterClasses)
      }

      // silentLetters
      if (settings.silentLetterActive && textEngineResult.silentLetters.includes(textIndex)) {
        classList.push('readapt-silent-letter')
      }

      if (classList.length > 0) {
        return `<span class="${classList.join(' ')}">${char}</span>`
      } else {
        return char
      }
    })

    context.processedSyllables += textEngineResult.syllables.length

    return `${textAdapted.join('')}`
  }

const hasSameList = (classList: string[], classListToCompare: string[]): boolean => {
  return xor(classList, classListToCompare).length === 0
}

const buildAdaptTextContent =
  (analyse: AnaliseTextFn) =>
  (htmlElement: HTMLElement, settings: Settings, liaisonsPhonemes: Set<string>): void => {
    const treeWalker = document.createTreeWalker(htmlElement, NodeFilter.SHOW_TEXT, {
      acceptNode: (node): number => {
        const parentElement = node.parentElement
        if (parentElement && ['STYLE', 'SCRIPT', 'NOSCRIPT'].includes(parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      }
    })
    const context: Context = {
      processedSyllables: 0
    }
    const adaptNode = buildAdaptTextNode(analyse, settings, liaisonsPhonemes, context)
    let currentNode
    while ((currentNode = treeWalker.nextNode())) {
      try {
        adaptNode(currentNode as Text)
      } catch (error) {
        console.warn('Error when adapting text', currentNode)
      }
    }
  }

const hasSameClasses = (classList: string[], element: Element): boolean => {
  return hasSameList(classList, element.classList as any as string[])
}

const hasTextRulesSettings = (settings: Settings): boolean => {
  const hasSyllableSetting = settings.syllableActive && (!!settings.syllableColor1 || !!settings.syllableColor2)
  const hasPhonemesSetting = settings.phonemesActive && hasItemActive(settings.phonemes)
  const hasLetterSetting = settings.lettersActive && hasItemActive(settings.letters)
  const hasLiaisonSetting = !!settings.liaisonsActive

  return hasSyllableSetting || settings.silentLetterActive || hasLetterSetting || hasPhonemesSetting || hasLiaisonSetting
}

const hasItemActive = (items: ColoredItem[]): boolean => items.some((item) => item.active)

const isSyllable = (charIndex: number, syllables: Syllable[], context: Context): string | undefined => {
  const indexSyllable = syllables.findIndex(([initPos, endPos]: Syllable) => {
    return charIndex >= initPos && charIndex <= endPos
  })

  if (indexSyllable === -1) {
    return
  }

  return (indexSyllable + context.processedSyllables) % 2 ? 'readapt-syllable-2' : 'readapt-syllable-1'
}

const findLiaison = (index: number, liaisons: Liaison[]) => {
  return liaisons.find(([start, end]) => {
    return index >= start && index <= end
  })
}

const adaptLetter = (settings: Settings, char: string): string[] => {
  const charCaseIgnored = char.toLowerCase()
  const activeLetter = settings.letters //
    .filter(({ active }) => active)
    .find((letter) => letter.value?.includes(charCaseIgnored))

  if (!activeLetter) {
    return []
  }
  const letterClasses = [`readapt-letter-${activeLetter.key}`]

  if (activeLetter.bold) {
    letterClasses.push('readapt-bold')
  }

  return letterClasses
}

const adaptPhoneme = (settings: Settings, phoneme: number): string[] => {
  const activePhoneme = settings.phonemes.find(({ active, key }) => active && phoneme === parseInt(key))

  const phonemesClasses: string[] = []
  if (activePhoneme) {
    phonemesClasses.push(`readapt-phoneme-${activePhoneme.key}`)
    if (activePhoneme.bold) {
      phonemesClasses.push('readapt-bold')
    }
  }
  return phonemesClasses
}

/**
 * build adaptTextNode
 * adaptTextNode manipulates the DOM to add readapt styles and classes
 */
const buildAdaptTextNode =
  (analyse: AnaliseTextFn, settings: Settings, liaisonsPhonemes: Set<string>, context: Context) =>
  (textNode: Text): void => {
    const text = textNode.nodeValue
    if (!text) {
      return
    }

    const contentSpan = document.createElement('span')
    contentSpan.classList.add('readapt-content')
    textNode.before(contentSpan)

    if (!hasTextRulesSettings(settings)) {
      contentSpan.textContent = textNode.textContent
      textNode.textContent = ''
      return
    }

    const textEngineResult = analyse(text, settings.language)
    text.split('').forEach((char: string, textIndex) => {
      const classList = []

      if (settings.syllableActive) {
        const syllable = isSyllable(textIndex, textEngineResult.syllables, context)
        if (syllable) {
          classList.push(syllable)
        }
      }

      if (settings.liaisonsActive && textEngineResult.liaisons) {
        const liaison = findLiaison(textIndex, textEngineResult.liaisons)
        if (liaison) {
          const [start, end, phoneme] = liaison
          liaisonsPhonemes.add(phoneme)
          if (start === textIndex) {
            classList.push('readapt-liaison-start', `readapt-liaison-${phoneme}`)
          } else if (start + 1 === textIndex) {
            classList.push('readapt-liaison-symbol')
          } else if (end === textIndex) {
            classList.push('readapt-liaison-end')
          }
        }
      }

      // phonemes
      let hasPhonemes = false
      const phoneme = textEngineResult.phonemes[textIndex]
      if (settings.phonemesActive && typeof phoneme === 'number') {
        const phonemeClasses = adaptPhoneme(settings, phoneme)
        hasPhonemes = phonemeClasses.length > 0
        classList.push(...phonemeClasses)
      }

      // letters
      if (settings.lettersActive && !hasPhonemes) {
        const letterClasses = adaptLetter(settings, char)
        classList.push(...letterClasses)
      }

      // silentLetters
      if (settings.silentLetterActive && textEngineResult.silentLetters.includes(textIndex)) {
        classList.push('readapt-silent-letter')
      }

      const lastChild = contentSpan.lastChild
      if (classList.length > 0) {
        if (lastChild?.nodeType === Node.ELEMENT_NODE && hasSameClasses(classList, lastChild as Element)) {
          lastChild.textContent += char
        } else {
          const span = document.createElement('span')
          span.classList.add(...classList)
          span.textContent = char
          contentSpan.appendChild(span)
        }
      } else if (lastChild?.nodeType === Node.TEXT_NODE) {
        lastChild.textContent += char
      } else {
        contentSpan.appendChild(document.createTextNode(char))
      }
    })

    context.processedSyllables += textEngineResult.syllables.length

    // clean the node
    textNode.textContent = ''
  }

export { buildAdaptTextContent, buildAdaptTextContentForText }
