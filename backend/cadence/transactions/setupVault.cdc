import "FungibleToken"
import "FungibleTokenMetadataViews"

// Generic transaction to setup a fungible token vault
// Pass in the contract address and storage/public paths
transaction(contractAddress: Address, contractName: String) {
  prepare(signer: auth(Storage, Capabilities) &Account) {
    // Construct the vault type
    let vaultType = CompositeType("A.".concat(contractAddress.toString()).concat(".").concat(contractName).concat(".Vault"))
      ?? panic("Could not construct vault type")
    
    // Get the vault data
    let resolverRef = getAccount(contractAddress).contracts.borrow<&{FungibleToken}>(name: contractName)
      ?? panic("Could not borrow contract reference")
    
    let vaultData = resolverRef.resolveContractView(
      resourceType: vaultType,
      viewType: Type<FungibleTokenMetadataViews.FTVaultData>()
    ) as! FungibleTokenMetadataViews.FTVaultData?
      ?? panic("Could not resolve FTVaultData view")
    
    // Check if vault already exists
    if signer.storage.borrow<&{FungibleToken.Vault}>(from: vaultData.storagePath) == nil {
      // Create a new empty vault
      let vault <- vaultData.createEmptyVault()
      signer.storage.save(<-vault, to: vaultData.storagePath)
    }
    
    // Always ensure public capabilities are properly set up
    signer.capabilities.unpublish(vaultData.receiverPath)
    signer.capabilities.unpublish(vaultData.metadataPath)
    
    // Issue and publish receiver capability
    let receiverCap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(vaultData.storagePath)
    signer.capabilities.publish(receiverCap, at: vaultData.receiverPath)
    
    // Issue and publish metadata/balance capability
    let metadataCap = signer.capabilities.storage.issue<&{FungibleToken.Vault}>(vaultData.storagePath)
    signer.capabilities.publish(metadataCap, at: vaultData.metadataPath)
  }
}
