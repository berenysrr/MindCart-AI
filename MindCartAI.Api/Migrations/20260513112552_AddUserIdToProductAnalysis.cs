using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindCartAI.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToProductAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "ProductAnalyses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ProductAnalyses");
        }
    }
}
