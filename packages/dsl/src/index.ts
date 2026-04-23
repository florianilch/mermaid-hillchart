import {
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  EmptyFileSystem,
  inject,
  type DefaultSharedCoreModuleContext,
  type LangiumCoreServices,
  type LangiumSharedCoreServices,
  type Module,
  type PartialLangiumCoreServices,
} from "langium"

import {
  HillChartGeneratedSharedModule,
  HillChartGrammarGeneratedModule,
} from "./generated/module.js"
import { HillChartTokenBuilder } from "./tokenBuilder.js"
import { HillChartValueConverter } from "./valueConverter.js"

/**
 * Declaration of `HillChart` services.
 */
interface HillChartAddedServices {
  parser: {
    TokenBuilder: HillChartTokenBuilder
    ValueConverter: HillChartValueConverter
  }
}

/**
 * Union of Langium default services and `HillChart` services.
 */
export type HillChartServices = LangiumCoreServices & HillChartAddedServices

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `HillChart` services.
 */
const HillChartModule: Module<
  HillChartServices,
  PartialLangiumCoreServices & HillChartAddedServices
> = {
  parser: {
    TokenBuilder: () => new HillChartTokenBuilder(),
    ValueConverter: () => new HillChartValueConverter(),
  },
}

/**
 * Initializes the Langium dependency injection container for the Hill Chart parser.
 */
export function createHillChartServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem,
): {
  shared: LangiumSharedCoreServices
  HillChart: HillChartServices
} {
  const shared = inject(createDefaultSharedCoreModule(context), HillChartGeneratedSharedModule)
  const HillChart = inject(
    createDefaultCoreModule({ shared }),
    HillChartGrammarGeneratedModule,
    HillChartModule,
  )
  shared.ServiceRegistry.register(HillChart)
  return { shared, HillChart }
}

export type { HillChartDiagram } from "./generated/ast.js"
export type { LangiumParser, ParseResult } from "langium"
