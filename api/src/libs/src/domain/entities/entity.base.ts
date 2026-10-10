/**
 * Base of every entity: identity by id.
 *
 * Unlike the SMC base, the id is a UUID string, because the web treats every
 * id as a string (RULES §2.9) and this service must speak the same contract
 * as Spring.
 */
export abstract class EntityBase {
  protected constructor(public readonly id: string) {}
}
