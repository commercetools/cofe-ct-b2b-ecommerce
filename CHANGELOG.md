# 1.1.5
- Add cart endpoint: updateOrderState
- bugfix: account without Admin role should not fail fetching getTree
# 1.1.4
- return addresses from BusinessUnitMapper
# 1.1.3
- return defaultBilling and shipping address IDs in businessUnit tree
# 1.1.2
- fetch only the current Business-unit's store in getMe
# 1.1.1
- updateQuoteRequestState
# 1.1.0
- refactor the way two module merge 
- remove duplicate module methods
- updating quote state should respect the cart's associate

- BREAKING: method extender is not exported from index anymore
# 1.0.28
- clear cartId on logout
- Store organization, account and associateEndpoint on CartApi initialization
- default the account and/or organization on CartApi to Api instance properties
- use associateEndpoint on all cart and order api calls
- bugfix: accepting a quote should assign the cart to the creator of the quote-request
# 1.0.27
- cart reassign should update cart email
# 1.0.26
- cart search/creation always use as-associate apis
# 1.0.25
- use as-associate endpoints to fetch cart
- use as-associate endpoints to create quote-request
- cart/order will reflect customerId
- CartFetcher prioritizes session cart over searching for cart
- cartController exposes getCartById, getAllSuperUserCarts and createCart actions
# 1.0.24
- add associate controller
# 1.0.23
- add rename and delete endpoint to wishlist controller
- refactor store spercific wishlist apis to use inStoreKeyWithStoreKeyValue
# 1.0.22
- add UpdateLineItemQuantity to Wishlist controller
- trim unwanted sessionData while login
# 1.0.21
- accepted quote-cart belogns to the one accept it
# 1.0.20
- remove LineItemShippingDetails on updating/adding to cart
# 1.0.19
- trim businessUnit stored in session
- trim store stored in session
- fix typings in BusinessUnitApi
- refactor BusinessUnitMapper to work like other Mappers 
- use StoreMappers to reduce store's data in session
- use sepcific mapper for GetTree
- update platform-sdk dependency to 4.6.0-alpha-associate-roles
# 1.0.18
- updating peer dependency
# 1.0.17
- Add SuperUser Capabilities
- Update README.md
- Add CHANGELOG.md
# 1.0.16
- fix getCustomerByEmail return type
# 1.0.15
- Type fix getMe api in BU
# 1.0.14
- getHighestNodesWithAssociation returns all the topLevelUnits
# 1.0.13
- update package
# 1.0.12
- Add purchase number to order
# 1.0.11
- Fix product query overriding private methods
# 1.0.10
- update version
- Adapt local types
- remove unused types
# 1.0.9
- Remove dashbaord