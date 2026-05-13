using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindCartAI.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToCoolDownAndRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "CoolDownItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CoolDownItems");
        }
    }
}
