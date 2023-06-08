job "deploy-dashboard-stage" {
    datacenters = ["ator-fin"]
    type = "batch"

    reschedule {
        attempts = 0
    }

    task "deploy-dashboard-task" {
        driver = "docker"

        config {
            image = "ghcr.io/ator-development/ator-dashboard:[[.deploy]]"
            force_pull = true
            entrypoint = ["yarn"]
            command = "deploy"
            args = []
            volumes = [
                "local/app.config.ts:/usr/src/app/app.config.ts"
            ]
        }

        vault {
            policies = ["dashboard-stage"]
        }

        template {
            data = <<EOH
            {{with secret "kv/dashboard/stage"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
            {{end}}
            NUXT_PUBLIC_RELAY_REGISTRY_ADDRESS="{{ key "smart-contracts/stage/relay-registry-address" }}"
            NUXT_PUBLIC_METRICS_DEPLOYER="{{ key "valid-ator/stage/validator-address-base64" }}"
            EOH
            destination = "secrets/file.env"
            env         = true
        }

        env {
            NUXT_PUBLIC_PHASE="stage"
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