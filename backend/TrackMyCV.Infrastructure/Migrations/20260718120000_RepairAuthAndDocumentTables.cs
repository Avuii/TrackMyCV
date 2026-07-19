using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TrackMyCV.Infrastructure.Data;

#nullable disable

namespace TrackMyCV.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260718120000_RepairAuthAndDocumentTables")]
    public partial class RepairAuthAndDocumentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[AppUsers]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [AppUsers] (
                        [Id] uniqueidentifier NOT NULL,
                        [Email] nvarchar(320) NOT NULL,
                        [DisplayName] nvarchar(160) NOT NULL,
                        [PasswordHash] nvarchar(512) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_AppUsers] PRIMARY KEY ([Id])
                    );
                END;

                IF OBJECT_ID(N'[AppUsers]', N'U') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AppUsers_Email' AND [object_id] = OBJECT_ID(N'[AppUsers]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_AppUsers_Email] ON [AppUsers] ([Email]);
                END;
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[JobApplications]', N'U') IS NOT NULL
                    AND COL_LENGTH(N'[JobApplications]', N'AppUserId') IS NULL
                BEGIN
                    ALTER TABLE [JobApplications] ADD [AppUserId] uniqueidentifier NULL;
                END;

                IF OBJECT_ID(N'[JobApplications]', N'U') IS NOT NULL
                    AND COL_LENGTH(N'[JobApplications]', N'AppUserId') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_JobApplications_AppUserId' AND [object_id] = OBJECT_ID(N'[JobApplications]'))
                BEGIN
                    CREATE INDEX [IX_JobApplications_AppUserId] ON [JobApplications] ([AppUserId]);
                END;

                IF OBJECT_ID(N'[JobApplications]', N'U') IS NOT NULL
                    AND OBJECT_ID(N'[AppUsers]', N'U') IS NOT NULL
                    AND COL_LENGTH(N'[JobApplications]', N'AppUserId') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_JobApplications_AppUsers_AppUserId')
                BEGIN
                    ALTER TABLE [JobApplications] ADD CONSTRAINT [FK_JobApplications_AppUsers_AppUserId]
                        FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([Id]) ON DELETE CASCADE;
                END;
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[AuthSessions]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [AuthSessions] (
                        [Id] uniqueidentifier NOT NULL,
                        [AppUserId] uniqueidentifier NOT NULL,
                        [TokenHash] nvarchar(128) NOT NULL,
                        [ExpiresAt] datetime2 NOT NULL,
                        [RevokedAt] datetime2 NULL,
                        [LastUsedAt] datetime2 NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_AuthSessions] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_AuthSessions_AppUsers_AppUserId] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([Id]) ON DELETE CASCADE
                    );
                END;

                IF OBJECT_ID(N'[AuthSessions]', N'U') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuthSessions_AppUserId' AND [object_id] = OBJECT_ID(N'[AuthSessions]'))
                BEGIN
                    CREATE INDEX [IX_AuthSessions_AppUserId] ON [AuthSessions] ([AppUserId]);
                END;

                IF OBJECT_ID(N'[AuthSessions]', N'U') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuthSessions_TokenHash' AND [object_id] = OBJECT_ID(N'[AuthSessions]'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_AuthSessions_TokenHash] ON [AuthSessions] ([TokenHash]);
                END;
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[UserDocuments]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [UserDocuments] (
                        [Id] uniqueidentifier NOT NULL,
                        [AppUserId] uniqueidentifier NOT NULL,
                        [Name] nvarchar(220) NOT NULL,
                        [Type] nvarchar(80) NOT NULL,
                        [Category] nvarchar(100) NOT NULL,
                        [OriginalFileName] nvarchar(260) NOT NULL,
                        [StoredFileName] nvarchar(260) NOT NULL,
                        [ContentType] nvarchar(120) NOT NULL,
                        [SizeBytes] bigint NOT NULL,
                        [RelativePath] nvarchar(700) NOT NULL,
                        [Url] nvarchar(700) NOT NULL,
                        [Language] nvarchar(20) NOT NULL,
                        [TargetRole] nvarchar(160) NOT NULL,
                        [Status] nvarchar(40) NOT NULL,
                        [Notes] nvarchar(max) NOT NULL,
                        [Tags] nvarchar(max) NOT NULL,
                        [SuccessRate] int NOT NULL,
                        [LastUsedAt] datetime2 NULL,
                        [IsDefault] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_UserDocuments] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserDocuments_AppUsers_AppUserId] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([Id]) ON DELETE CASCADE
                    );
                END;

                IF OBJECT_ID(N'[UserDocuments]', N'U') IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_UserDocuments_AppUserId' AND [object_id] = OBJECT_ID(N'[UserDocuments]'))
                BEGIN
                    CREATE INDEX [IX_UserDocuments_AppUserId] ON [UserDocuments] ([AppUserId]);
                END;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
