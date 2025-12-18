BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PaymentAttempt] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [operationCode] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [PaymentAttempt_status_df] DEFAULT 'PENDING',
    [imageUrl] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PaymentAttempt_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PaymentAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[PaymentAttempt] ADD CONSTRAINT [PaymentAttempt_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
