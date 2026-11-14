CREATE TABLE dbo.Product (
    `ID` string NULL, 
    `Name` string NULL, 
    `SKU` string NULL, 
    `Description` string NULL, 
    `Price` decimal(34,6) NULL, 
    `StockQuantity` int NULL, 
    `ReorderLevel` int NULL, 
    `CreatedDate` timestamp NULL, 
    `ModifiedDate` timestamp NULL, 
    `IsActive` boolean NULL, 
    `CreatedOn` timestamp NULL, 
    `ModifiedOn` timestamp NULL, 
    `CreatedByID` string NULL, 
    `ModifiedByID` string NULL, 
    `StatusID` string NULL, 
    `OwnerID` string NULL, 
    `URLSlug` string NULL
)
USING DELTA