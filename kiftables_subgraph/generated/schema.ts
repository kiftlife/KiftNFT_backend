// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Attribute extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Attribute entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Attribute must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Attribute", id.toString(), this);
    }
  }

  static load(id: string): Attribute | null {
    return changetype<Attribute | null>(store.get("Attribute", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get trait_type(): string {
    let value = this.get("trait_type");
    return value!.toString();
  }

  set trait_type(value: string) {
    this.set("trait_type", Value.fromString(value));
  }

  get value(): string {
    let value = this.get("value");
    return value!.toString();
  }

  set value(value: string) {
    this.set("value", Value.fromString(value));
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Token entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Token must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Token", id.toString(), this);
    }
  }

  static load(id: string): Token | null {
    return changetype<Token | null>(store.get("Token", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokenID(): BigInt {
    let value = this.get("tokenID");
    return value!.toBigInt();
  }

  set tokenID(value: BigInt) {
    this.set("tokenID", Value.fromBigInt(value));
  }

  get updatedAtTimestamp(): BigInt | null {
    let value = this.get("updatedAtTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set updatedAtTimestamp(value: BigInt | null) {
    if (!value) {
      this.unset("updatedAtTimestamp");
    } else {
      this.set("updatedAtTimestamp", Value.fromBigInt(<BigInt>value));
    }
  }

  get owner(): string {
    let value = this.get("owner");
    return value!.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get name(): string | null {
    let value = this.get("name");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (!value) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(<string>value));
    }
  }

  get description(): string | null {
    let value = this.get("description");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set description(value: string | null) {
    if (!value) {
      this.unset("description");
    } else {
      this.set("description", Value.fromString(<string>value));
    }
  }

  get image(): string | null {
    let value = this.get("image");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set image(value: string | null) {
    if (!value) {
      this.unset("image");
    } else {
      this.set("image", Value.fromString(<string>value));
    }
  }

  get tokenURI(): string | null {
    let value = this.get("tokenURI");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set tokenURI(value: string | null) {
    if (!value) {
      this.unset("tokenURI");
    } else {
      this.set("tokenURI", Value.fromString(<string>value));
    }
  }

  get ipfsURI(): string | null {
    let value = this.get("ipfsURI");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set ipfsURI(value: string | null) {
    if (!value) {
      this.unset("ipfsURI");
    } else {
      this.set("ipfsURI", Value.fromString(<string>value));
    }
  }

  get attributes(): Array<string> {
    let value = this.get("attributes");
    return value!.toStringArray();
  }

  set attributes(value: Array<string>) {
    this.set("attributes", Value.fromStringArray(value));
  }

  get revealed(): boolean {
    let value = this.get("revealed");
    return value!.toBoolean();
  }

  set revealed(value: boolean) {
    this.set("revealed", Value.fromBoolean(value));
  }

  get revealDataSet(): boolean {
    let value = this.get("revealDataSet");
    return value!.toBoolean();
  }

  set revealDataSet(value: boolean) {
    this.set("revealDataSet", Value.fromBoolean(value));
  }
}

export class User extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save User entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type User must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("User", id.toString(), this);
    }
  }

  static load(id: string): User | null {
    return changetype<User | null>(store.get("User", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value!.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }
}
