job "deploy-dashboard-live" {
    datacenters = ["ator-fin"]
    type = "batch"

    reschedule {
        attempts = 0
    }

    task "deploy-dashboard-task" {
        driver = "docker"

        config {
            image = "ghcr.io/ator-development/ator-dashboard:[[.deploy]]"
            entrypoint = ["yarn"]
            command = "deploy"
            args = []
        }

        vault {
            policies = ["dashboard-live"]
        }

        template {
            data = <<EOH
            NUXT_PUBLIC_RELAY_REGISTRY_ADDRESS={{ key "smart-contracts/live/relay-registry-address" }}
            NUXT_PUBLIC_METRICS_DEPLOYER={{ key "valid-ator/live/validator-address-base64" }}
            {{with secret "kv/dashboard/live"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
            {{end}}
            EOH
            destination = "secrets/file.env"
            env         = true
        }

        env {
            PHASE="live"
            DASHBOARD_VERSION="[[.commit_sha]]"
        }

        restart {
            attempts = 0
            mode = "fail"
        }

        resources {
            cpu    = 4096
            memory = 4096
        }
    }
}