FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["MindCartAI.Api/MindCartAI.Api.csproj", "MindCartAI.Api/"]
RUN dotnet restore "MindCartAI.Api/MindCartAI.Api.csproj"

COPY . .
WORKDIR /src/MindCartAI.Api
RUN dotnet publish "MindCartAI.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "MindCartAI.Api.dll"]