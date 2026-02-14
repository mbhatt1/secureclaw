[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / createReceiptCard

# Function: createReceiptCard()

> **createReceiptCard**(`params`): `FlexBubble`

Defined in: [line/flex-templates.ts:428](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/line/flex-templates.ts#L428)

Create a receipt/summary card (for orders, transactions, data tables)

Editorial design: Clean table layout with alternating row backgrounds,
prominent total section, and clear visual hierarchy.

## Parameters

### params

#### footer?

`string`

#### items

`object`[]

#### subtitle?

`string`

#### title

`string`

#### total?

\{ `label`: `string`; `value`: `string`; \}

#### total.label

`string`

#### total.value

`string`

## Returns

`FlexBubble`
