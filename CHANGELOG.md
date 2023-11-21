# 2.0.5
- Delete quotedCart from session
# 2.0.4
- add deleteQuotedCart endpoint
# 2.0.3
- FIX updateLineitemCount in wishlost controller
# 2.0.2
- Add Approval rules/flows
- Multitenancy migration
# 2.0.1
- FIX typing in associate role mix with Approval flow
# 2.0.1
- Associate inheritance
# 2.0.0
- migration to multitenant config
# 1.3.1
- considers current locale when mapping product price
# 1.3.0
- Update cofe-ct-ecommerce dependency
- Update platform-sdk dependency
- remove unchanged methods from cofe-ct-ecommerce in AccountController
- return statuscode: 401 to catch in frontend-sdk
- rename accontMapper to accountMapper
- FIX expansions for cart
- add categories and scopedDiscounts to defaultFacets

# 1.2.2
- bugfix: split lineitem
# 1.2.0
- use storeProjection instead of distribution channel, using product projection endpoint
- pass distribution channel and supply channel for price/availability selection
- rewrite productMapper to use channels
- refactor StoreMapper to fetch channels of the store
- remove distribution channel from sessionData.organization
# 1.1.10
- remove unused argument from ProductMapper
- store supplyChannel in organization
- remove method getPriceChannelAvailability and use default availability ib ProductMapper
# 1.1.9
- bug fix: lineItem url generation
# 1.1.8
- bug fix: get organization tree should fetch all nodes without taking admin role into considration
# 1.1.7
- bug fix: superuser with only one organization
# 1.1.6
- Add isAdmin to getTree response
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