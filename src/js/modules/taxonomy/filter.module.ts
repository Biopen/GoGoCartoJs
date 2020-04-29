import { Option, Category, Element, ElementModerationState } from '../../classes/classes';

import { App } from '../../gogocarto';
declare let $: any;

export class FilterModule {
  showOnlyFavorite_ = false;
  showOnlyPending_ = false;
  showOnlyModeration_ = false;

  constructor() {}

  showOnlyFavorite(bool: boolean) {
    this.showOnlyFavorite_ = bool;
  }

  showOnlyPending(bool: boolean) {
    this.showOnlyPending_ = bool;
  }

  showOnlyModeration(bool: boolean) {
    this.showOnlyModeration_ = bool;
  }

  checkIfElementPassFilters(element: Element): boolean {
    if (element.optionsValues.length == 0) return false;

    if (this.showOnlyFavorite_) return element.isFavorite;

    if (
      this.showOnlyModeration_ &&
      (!element.needsModeration() || element.moderationState == ElementModerationState.PossibleDuplicate)
    )
      return false;
    if (App.config.isFeatureAvailable('pending')) {
      if (this.showOnlyPending_ && !element.isPending()) return false;
    } else {
      if (element.isPending()) return false;
    }

    if (!App.config.menu.showOnePanePerMainOption) {
      const checkedMainOptions = App.taxonomyModule.taxonomy.nonDisabledOptions;
      if (checkedMainOptions.length == 1) return this.recursivelyCheckInOption(checkedMainOptions[0], element);
      else
        return checkedMainOptions.some(
          (mainOption) => element.haveOption(mainOption) || this.recursivelyCheckInOption(mainOption, element)
        );
    } else if (App.currMainId == 'all') {
      const mainOptionsChecked = App.taxonomyModule.getMainOptions().filter((child) => !child.isDisabled);
      const mainCategoryFilled = mainOptionsChecked.some((mainOption) => element.haveOption(mainOption));
      const otherCategoriesFilled = App.taxonomyModule.otherRootCategories.every((category) =>
        this.recursivelyCheckInCategory(category, element)
      );
      return mainCategoryFilled && otherCategoriesFilled;
    } else {
      const mainOption = App.taxonomyModule.getCurrMainOption();
      const mainOptionFilled = this.recursivelyCheckInOption(mainOption, element);
      const otherCategoriesFilled = App.taxonomyModule.otherRootCategories.every((category) =>
        this.recursivelyCheckInCategory(category, element)
      );
      return mainOptionFilled && otherCategoriesFilled;
    }
  }

  log = false;

  private recursivelyCheckInOption(option: Option, element: Element): boolean {
    if (this.log) console.log('Check for option ', option.name);

    let result;
    if (option.subcategories.length == 0 || (option.isDisabled && !option.isMainOption)) {
      if (this.log) console.log('No subcategories ');
      result = option.isChecked && element.haveOption(option);
    } else {
      result = option.subcategories.every((category) => this.recursivelyCheckInCategory(category, element));
    }
    if (this.log) console.log('Return ', result);
    return result;
  }

  private recursivelyCheckInCategory(category: Category, element: Element): boolean {
    if (this.log) console.log('--' + 'Category', category.name);

    if (!category.useForFiltering) return true;
    if (category.isDisabled && !category.isMandatory) return true;
    const checkedOptions = category.checkedOptions;
    let elementOptions = element.getOptionValueByCategoryId(category.id);
    if (App.config.menu.showOnePanePerMainOption)
      elementOptions = elementOptions.filter((optValue) => optValue.optionId != App.currMainId);

    // if this element don't have any option in this category, don't need to check
    if (elementOptions.length == 0 && this.log)
      console.log('--' + "Element don't have options in this category. Catgeoyr mandatory ? ", category.isMandatory);
    if (elementOptions.length == 0) return !category.isMandatory && category.isChecked;

    const isSomeOptionInCategoryCheckedOptions = elementOptions.some(
      (optionValue) => checkedOptions.indexOf(optionValue.option) > -1
    );

    if (this.log) console.log('--' + 'isSomeOptionInCategoryCheckedOptions', isSomeOptionInCategoryCheckedOptions);
    if (isSomeOptionInCategoryCheckedOptions) return true;
    else {
      if (this.log) console.log('--' + 'So we checked in suboptions', category.name);
      return elementOptions.some((optionValue) => this.recursivelyCheckInOption(optionValue.option, element));
    }
  }
}
