BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CLIENT',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Venue] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [address] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [district] NVARCHAR(1000),
    [imageUrl] NVARCHAR(1000),
    [yapeQrUrl] NVARCHAR(1000),
    [googleMapsUrl] NVARCHAR(1000),
    [ownerId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Venue_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Venue_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Court] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [sport] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000),
    [pricePerHour] FLOAT(53) NOT NULL,
    [venueId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Court_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Court_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Schedule] (
    [id] INT NOT NULL IDENTITY(1,1),
    [courtId] INT NOT NULL,
    [dayOfWeek] INT NOT NULL,
    [startTime] NVARCHAR(1000) NOT NULL,
    [endTime] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    CONSTRAINT [Schedule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Booking] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [courtId] INT NOT NULL,
    [startTime] DATETIME2 NOT NULL,
    [endTime] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Booking_status_df] DEFAULT 'PENDING',
    [totalPrice] FLOAT(53) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Booking_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Booking_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Venue] ADD CONSTRAINT [Venue_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Court] ADD CONSTRAINT [Court_venueId_fkey] FOREIGN KEY ([venueId]) REFERENCES [dbo].[Venue]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Schedule] ADD CONSTRAINT [Schedule_courtId_fkey] FOREIGN KEY ([courtId]) REFERENCES [dbo].[Court]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_courtId_fkey] FOREIGN KEY ([courtId]) REFERENCES [dbo].[Court]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
